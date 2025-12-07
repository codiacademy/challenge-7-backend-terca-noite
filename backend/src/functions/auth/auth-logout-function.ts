import type { LoginUserType } from "../../types/users/user-types.ts";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type { FastifyInstance } from "fastify";
import { revokeRefreshToken } from "../../utils/tokens-service";

export async function authLogoutFunction(
  app: FastifyInstance,
  refreshToken: string,
  userId: string,
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new AppError("Id de usuário não cadastrada!");
    }

    const revokedToken = await revokeRefreshToken(userId, refreshToken);
    return revokedToken;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao deletar usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processor sua solicitação", 500);
  }
}
