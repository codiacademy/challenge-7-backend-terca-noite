import { prisma } from "../../lib/prisma";

export async function readFilteredExpensesFunction(userId: string, filters: any) {
  const { status, category, search, from, to, page, limit } = filters;

  const where: any = {
    created_by: userId,
  };

  if (category) {
    where.category = category;
  }
  if (status) {
    where.status = status;
  }

  if (search) {
    where.description = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (from || to) {
    where.due_date = {}; // ⬅️ Corrigido: usando due_date

    if (from) {
      // Se 'from' é uma Date (como deveria ser após z.coerce.date().optional() no Zod)
      where.due_date.gte = from;
    }

    if (to) {
      // Para garantir que a data final inclua o dia inteiro:
      // Se 'to' é 2024-12-05, queremos incluir até 2024-12-05 23:59:59.999
      // Se o 'to' já vem como objeto Date do Zod, podemos adicionar 1 dia.
      const dateTo = new Date(to);
      dateTo.setDate(dateTo.getDate() + 1);
      where.due_date.lt = dateTo; // Menor que o início do dia seguinte
    }
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
