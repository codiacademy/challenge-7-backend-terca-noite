import type { ProfileChangeType } from "../../types/users/user-types.ts";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function updateUserProfileFunction({
  userId,
  fullName,
  email,
  telephone,
}: ProfileChangeType) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new AppError("Usuário não encontrado", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined && { name: fullName }),
        ...(email !== undefined && { email }),
        ...(telephone !== undefined && { telephone }),
      },
      select: {
        name: true,
        email: true,
        telephone: true,
      },
    });
    return updatedUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao atualizar o perfil do usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
