import { prisma } from "../../lib/prisma";

export async function readFilteredExpensesFunction(userId: string, filters: any) {
  const { status, category, search, from, to, page, limit } = filters;

  const where: any = {
    created_by: userId,
  };

  if (category) {
    if (category != "") {
      where.category = category;
    }
  }
  if (status) {
    if (status != "") {
      where.status = status;
    }
  }

  if (search) {
    where.OR = [{ description: { contains: search, mode: "insensitive" } }];
  }

  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from);
    if (to) where.created_at.lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [total, expenses] = await Promise.all([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      skip,
      take: limit,
      orderBy: { due_date: "desc" },
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    expenses,
  };
}
