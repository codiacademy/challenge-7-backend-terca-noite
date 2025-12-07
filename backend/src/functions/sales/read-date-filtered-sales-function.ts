import { prisma } from "../../lib/prisma";
import { Sale } from "../../types/sales/sale-types";

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

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { created_at: "desc" },
  });

  return {
    sales,
  };
}
