import type { ChangeExpenseData } from "../../types/expenses/expense-types.ts";
import { prisma } from "../../lib/prisma.ts";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";
import { AppError } from "../../utils/app-error.ts";
import { parse } from "date-fns";

export async function updateExpenseFunction({
  id,
  date,
  description,
  category,
  value,
  status,
}: ChangeExpenseData) {
  try {
    const existingSale = await prisma.expense.findUnique({
      where: {
        id,
      },
    });
    if (!existingSale) throw new AppError("Despesa não consta no banco de dados.", 401);
    const parsedDueDate = parse(date, "dd/MM/yyyy", new Date());
    const convertedCategory = category.toLowerCase() as unknown as ExpenseCategory;
    const convertedStatus = status.toLowerCase() as unknown as ExpenseStatus;
    const updatedSale = await prisma.expense.update({
      where: {
        id,
      },
      data: {
        due_date: parsedDueDate,
        description,
        category: convertedCategory,
        status: convertedStatus,
        value,
      },
    });

    return updatedSale;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error("Erro operacional ao atualizar despesa ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
