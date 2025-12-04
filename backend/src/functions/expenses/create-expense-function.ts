import type { CreateExpenseData } from "../../types/expenses/expense-types.ts";
import { ExpenseCategory, ExpenseStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { parse } from "date-fns";
export async function createExpenseFunction({
  userId,
  date,
  description,
  category,
  value,
  status,
}: CreateExpenseData) {
  try {
    const parsedDueDate = parse(date, "dd/MM/yyyy", new Date());
    const convertedCategory = category.toLowerCase() as unknown as ExpenseCategory;
    const convertedStatus = status.toLowerCase() as unknown as ExpenseStatus;
    const createdExpense = await prisma.expense.create({
      data: {
        due_date: parsedDueDate,
        description,
        category: convertedCategory,
        value,
        status: convertedStatus,
        created_by: userId,
      },
    });

    return createdExpense;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error("Erro operacional ao criar despesa ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
