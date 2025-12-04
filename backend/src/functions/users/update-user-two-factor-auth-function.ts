import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function updateUserTwoFactorAuthFunction(userId: string) {
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
        two_factor_enabled: !existingUser.two_factor_enabled,
      },
    });

    return updatedUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao atualizar a verificação em duas etapas do", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
