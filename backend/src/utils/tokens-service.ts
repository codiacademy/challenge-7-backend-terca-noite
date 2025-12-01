import type { FastifyInstance } from "fastify";
import type { SaveRefreshTokenType } from "../types/auth/refresh-token-types.ts";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { AppError } from "./app-error";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto"; // Certifique-se que esta importação está presente!
import ms from "ms";
import type { Payload } from "@prisma/client/runtime/library";

// Interface que define o payload esperado para o Refresh Token, incluindo o 'jti'
interface RefreshPayload {
  id: string;
  email: string;
  name: string;
  type: "refresh";
  jti: string; // Adicionado para resolver o erro de tipagem
}

export async function getValidToken(userId: string, refreshToken: string) {
  const userTokens = await prisma.refreshtokens.findMany({
    where: { userId },
  });
  if (!userTokens.length) {
    console.log("Usuário não tem tokens no DB.");
    throw new AppError("Token inválido ou expirado (Usuário sem tokens)", 401);
  }
  console.log("Procurando Tokens no db...");
  // Compara o hash de todos os tokens.
  for (const token of userTokens) {
    const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);

    if (isMatch) {
      console.log("Token Encontrado no db!");
      // Token encontrado pelo hash. Agora, verifica o status de revogação.
      if (token.is_revoked) {
        console.log("Token já revogado!");
        // Se o token for encontrado, mas já estiver revogado (o que acontece no Token Replay)
        // LANÇA ERRO 401, corrigindo o Teste 3.
        throw new AppError("Token já foi revogado", 401);
      }
      return token; // Token válido e não revogado.
    }
  }

  console.log("Token não encontrado!");

  // Se o hash não corresponder a nenhum token (ativo ou inativo).
  throw new AppError("Token inválido ou expirado", 401);
}

export async function isRefreshTokenValid(userId: string, refreshToken: string) {
  // Esta função agora confia mais no getValidToken para validação de status e revogação.

  // O token deve ser válido e não revogado. Se estiver revogado, getValidToken lança 401.
  try {
    const retrievedToken = await getValidToken(userId, refreshToken);

    const now = Date.now();
    const expiresAt = new Date(retrievedToken.expiresAt).getTime();
    console.log("A analisar expiração do token ");
    if (expiresAt < now) {
      console.log("Token expirado!");
      // Se expirou (mas não foi revogado), revoga no DB e retorna false
      await revokeRefreshToken(userId, refreshToken);
      return false;
    }

    console.log("Token Válido!");

    return true; // Token válido, não expirado, e não revogado.
  } catch (error) {
    // Se getValidToken lançar um 401/403 (Token revogado ou não encontrado), a validação falha.
    if (error instanceof AppError && error.statusCode === 401) {
      console.log("Token com erro: " + refreshToken);
      console.log("Erro 401: " + error);
      return false;
    }
    // Repassa outros erros
    throw error;
  }
}

export async function revokeRefreshToken(userId: string, refreshToken: string) {
  try {
    // getValidToken garantirá que o token exista, que o hash bata, E que ele NÃO esteja revogado.
    // Se o token já estiver revogado (Token Replay), getValidToken lança 401 e impede a revogação.
    const retrievedToken = await getValidToken(userId, refreshToken);

    if (!retrievedToken || !retrievedToken.id) {
      // Este bloco é apenas um fallback, pois getValidToken já deveria ter lançado o erro.
      throw new AppError("Token não encontrado ou já revogado", 401);
    }

    return await prisma.refreshtokens.update({
      where: { id: retrievedToken.id },
      data: { is_revoked: true, last_used_at: new Date() },
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro ao revogar token:", error);
    throw new AppError("Ocorreu um erro ao revogar o token", 500);
  }
}

export async function saveRefreshToken({ userId, refreshToken, expiresAt }: SaveRefreshTokenType) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new AppError("Usuário não encontrado", 404); // Status 404 é mais apropriado para entidade não encontrada
    }

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const createdRefreshToken = await prisma.refreshtokens.create({
      data: {
        id: randomUUID(),
        tokenHash: refreshTokenHash,
        userId,
        expiresAt,
      },
    });

    return createdRefreshToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao registrar refresh token ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}

export async function generateTokens(
  fastify: FastifyInstance,
  payload: { userId: string; email: string; name: string },
) {
  const accessToken = await fastify.jwt.sign(
    {
      id: payload.userId, // Mudando de id para userId
      email: payload.email,
      name: payload.name,
      type: "access",
    },
    { expiresIn: env.JWT_EXPIRES_IN },
  );

  // Payload do Refresh Token com jti para garantir unicidade
  const refreshPayload: RefreshPayload = {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    type: "refresh",
    jti: randomUUID(), // Garante que o payload é único
  };

  const refreshToken = await fastify.jwt.sign(
    refreshPayload, // Usando o payload tipado
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );

  const expiresIn = env.JWT_REFRESH_EXPIRES_IN;
  const expiresAt = new Date(Date.now() + ms(expiresIn as ms.StringValue));
  const savedRefreshToken = await saveRefreshToken({
    userId: payload.userId,
    refreshToken,
    expiresAt: expiresAt.toString(),
  });

  return { accessToken, refreshToken };
}

export async function generateTwoFactorTempToken(
  app: FastifyInstance,
  userId: string,
  email: string,
  name: string,
) {
  return app.jwt.sign(
    {
      id: userId,
      email,
      name: name,
      type: "2fa_pending",
    },
    {
      expiresIn: "5m", // expira em 5 minutos
    },
  );
}
