import { prisma } from "../../lib/prisma.ts";

export async function readDateFilteredExpensesFunction(userId: string, filters: any) {
  const { from, to } = filters;

  const where: any = {
    created_by: userId,
  };

  if (from || to) {
    where.due_date = {};
    if (from) where.due_date.gte = new Date(from);
    if (to) where.due_date.lte = new Date(to);
  }

  const [expenses] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { due_date: "desc" },
    }),
  ]);
  return {
    expenses,
  };
}
