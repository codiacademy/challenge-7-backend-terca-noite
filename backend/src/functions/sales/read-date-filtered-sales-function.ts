import { prisma } from "../../lib/prisma";

export async function readDateFilteredSalesFunction(userId: string, filters: any) {
  const { from, to } = filters;

  const where: any = {
    created_by: userId,
  };

  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from);
    if (to) where.created_at.lte = new Date(to);
  }

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { created_at: "desc" },
    }),
  ]);

  return {
    sales,
  };
}
