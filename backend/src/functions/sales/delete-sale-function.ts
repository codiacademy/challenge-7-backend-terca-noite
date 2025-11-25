import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
export async function deleteSaleFunction(saleId: string) {
  try {
    const existingSale = await prisma.sale.findUnique({
      where: {
        id: saleId,
      },
    });

    if (!existingSale)
      throw new AppError("Venda com id " + saleId + " não existe no banco de dados");

    await prisma.sale.delete({
      where: { id: saleId },
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao deletar venda ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
