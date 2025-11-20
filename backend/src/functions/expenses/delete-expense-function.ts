import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
export async function deleteExpenseFunction(expenseId: string) {
  try {
    const existingSale = await prisma.expense.findUnique({
      where: {
        id: expenseId,
      },
    });

    if (!existingSale)
      throw new AppError("Despesa com id " + expenseId + " não existe no banco de dados");

    await prisma.expense.delete({
      where: { id: expenseId },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao deletar venda ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
