// auth.service.ts (ou função utilitária)
import type { FastifyInstance } from "fastify";
import type { SaveRefreshTokenType } from "../types/auth/refresh-token-types.ts";
import { env } from "../config/env.ts";
import { prisma } from "../lib/prisma.ts";
import { AppError } from "./app-error.ts";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import ms from "ms";
import type { Payload } from "@prisma/client/runtime/library";

export async function getValidToken(userId: string, refreshToken: string) {
  const userTokens = await prisma.refreshtokens.findMany({
    where: { userId, is_revoked: false },
  });

  if (!userTokens.length) {
    throw new AppError("Nenhum token encontrado para este usuário", 404);
  }

  for (const token of userTokens) {
    const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);
    if (isMatch) return token;
  }

  throw new AppError("Token não encontrado ou já revogado", 404);
}

export async function isRefreshTokenValid(userId: string, refreshToken: string) {
  const userTokens = await prisma.refreshtokens.findMany({
    where: { userId, is_revoked: false },
    select: { userId: true, tokenHash: true, expiresAt: true },
  });
  if (!userTokens.length) {
    throw new AppError("Nenhum token encontrado para este usuário", 404);
  }

  for (const token of userTokens) {
    const isMatch = await bcrypt.compare(refreshToken, token.tokenHash);
    if (!isMatch) {
      return false;
    } else {
      console.log("Match!");
      const now = Date.now();
      //  Verifica expiração (token.expiresAt é string → converte para Date)
      const expiresAt = new Date(token.expiresAt).getTime();
      if (expiresAt < now) {
        revokeRefreshToken(userId, refreshToken);
      }
      return true;
    }
  }
}
export async function revokeRefreshToken(userId: string, refreshToken: string) {
  try {
    const retrievedToken = await getValidToken(userId, refreshToken);

    if (!retrievedToken || !retrievedToken.id) {
      throw new AppError("Token não encontrado", 404);
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
      throw new AppError("Usuário não encontrado", 201);
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

  const refreshToken = await fastify.jwt.sign(
    {
      id: payload.userId, // Mudando de id para userId
      email: payload.email,
      name: payload.name,
      type: "refresh",
    },
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
