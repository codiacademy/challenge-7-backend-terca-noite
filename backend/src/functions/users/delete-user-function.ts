import { AppError } from "../../utils/app-error";
import { prisma } from "../../lib/prisma";

export async function deleteUserFunction(userId: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new AppError("Id de usuário não cadastrada!");
    }

    await prisma.sale.deleteMany({
      where: { created_by: userId },
    });
    await prisma.expense.deleteMany({
      where: { created_by: userId },
    });
    await prisma.authState.deleteMany({
      where: { userId },
    });
    await prisma.refreshtokens.deleteMany({
      where: { userId },
    });
    await prisma.twoFactorRequest.deleteMany({
      where: { userId },
    });
    await prisma.sale.deleteMany({
      where: { created_by: userId },
    });
    const deletedUser = prisma.user.delete({
      where: { id: userId },
    });

    return deletedUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao deletar usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
