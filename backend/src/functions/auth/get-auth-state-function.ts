import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function getAuthStateFunction(state: string) {
  try {
    const existingState = await prisma.authState.findUnique({
      where: {
        state,
      },
    });
    console.log("authState no plugin:" + state);
    if (!existingState) throw new AppError("Auth State não existe no banco de dados", 400);
    return existingState;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao pegar Auth State  ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
