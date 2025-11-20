import { prisma } from "../../lib/prisma.ts";

export async function readDateFilteredExpensesFunction(userId: string, filters: any) {
  const { from, to } = filters;

  const where: any = {
    created_by: userId,
  };

  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from);
    if (to) where.created_at.lte = new Date(to);
  }

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: { created_at: "desc" },
    }),
  ]);

  return {
    expenses,
  };
}
