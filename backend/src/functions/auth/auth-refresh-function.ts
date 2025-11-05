import type { CheckRefreshTokenType } from "../../types/auth/refresh-token-types.ts";
import { AppError } from "../../utils/app-error.ts";
import {
  isRefreshTokenValid,
  revokeRefreshToken,
  generateTokens,
} from "../../utils/tokens-service.ts";

export async function authRefreshFunction({
  app,
  userId,
  decodedToken,
  refreshToken,
}: CheckRefreshTokenType) {
  try {
    const valid = await isRefreshTokenValid(userId, refreshToken);
    if (!valid) {
      throw new AppError("Refresh token revogado ou inválido", 403);
    }

    const tokens = await generateTokens(app, {
      userId: decodedToken.userId,
      email: decodedToken.email,
      name: decodedToken.name,
    });

    await revokeRefreshToken(decodedToken.userId, refreshToken);
    return tokens;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao deletar usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processor sua solicitação", 500);
  }
}
