import { AppError } from "../../utils/app-error";
import { prisma } from "../../lib/prisma";

export async function deleteTwoFactorRequestFunction(requestId: string) {
  try {
    const existingTwoFactorRequest = await prisma.twoFactorRequest.findUnique({
      where: { id: requestId },
    });
    if (!existingTwoFactorRequest) {
      return;
    }

    const deletedTwoFactorRequest = prisma.twoFactorRequest.delete({
      where: { id: requestId },
    });

    return deletedTwoFactorRequest;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao deletar Two Factor Request ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
