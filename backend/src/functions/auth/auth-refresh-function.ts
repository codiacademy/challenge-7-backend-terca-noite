import type { CheckRefreshTokenType } from "../../types/auth/refresh-token-types.ts";
import { AppError } from "../../utils/app-error";
import {
  isRefreshTokenValid,
  revokeRefreshToken,
  generateTokens,
} from "../../utils/tokens-service";
import type { FastifyInstance } from "fastify";
export async function authRefreshFunction(
  app: FastifyInstance,
  { userId, decodedToken, refreshToken }: CheckRefreshTokenType,
) {
  try {
    const valid = await isRefreshTokenValid(userId, refreshToken);
    console.log("👍 Token Válido: " + valid);
    if (!valid) {
      throw new AppError("Refresh token revogado ou inválido", 403);
    }
    const tokens = await generateTokens(app, {
      userId,
      email: decodedToken.email,
      name: decodedToken.name,
    });

    await revokeRefreshToken(userId, refreshToken);
    return tokens;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao deletar usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processor sua solicitação", 500);
  }
}
