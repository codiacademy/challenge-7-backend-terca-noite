import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
import {
  isRefreshTokenValid,
  revokeRefreshToken,
  generateTokens,
} from "../../utils/tokens-service.ts";
import type { FastifyInstance } from "fastify";
export async function getUserIdFromAuthStateFunction(state: string) {
  try {
    const existingState = await prisma.authState.findUnique({
      where: {
        state,
      },
    });
    console.log("authState no callback:" + state);
    if (!existingState) throw new AppError("Auth State não existe no banco de dados", 400);
    return existingState.userId;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao pegar Auth State  ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
