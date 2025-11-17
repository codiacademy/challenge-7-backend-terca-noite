import { prisma } from "../../lib/prisma.ts";

export async function readFilteredSalesFunction(userId: string, filters: any) {
  const { courseType, search, from, to, page, limit } = filters;

  const where: any = {
    created_by: userId,
  };

  if (courseType) {
    where.course_type = courseType;
  }

  if (search) {
    where.OR = [
      { client_name: { contains: search, mode: "insensitive" } },
      { client_email: { contains: search, mode: "insensitive" } },
      { client_phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from);
    if (to) where.created_at.lte = new Date(to);
  }

  const skip = (page - 1) * limit;

  const [total, sales] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    sales,
  };
}
