import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

import type { FastifyInstance } from "fastify";
export async function createAuthStateFunction(userId: string, expireDate: Date) {
  try {
    const createdState = await prisma.authState.create({
      data: {
        userId: userId, // ID do usuário logado (vem do JWT)
        expiresAt: expireDate, // Expira em 10 minutos
      },
    });

    return createdState;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao criar Auth State  ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
