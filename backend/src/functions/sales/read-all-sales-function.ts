import { prisma } from "../../lib/prisma.ts";
import { format } from "date-fns";
export async function readAllSalesFunction(userId: string) {
  try {
    const sales = await prisma.sale.findMany({
      where: { created_by: userId },
      orderBy: { created_at: "desc" },
    });

    const formattedSales = sales.map((sale) => ({
      id: sale.id,
      date: format(sale.created_at, "yyyy-MM-dd"),
      customer: {
        name: sale.client_name,
        email: sale.client_email,
        phone: sale.client_phone,
        cpf: sale.cpf,
      },
      course: {
        type: sale.course_type,
        name: sale.course,
        price: Number(sale.course_value),
      },
      discount: Number(sale.discount_value),
      taxes: Number(sale.taxes_value),
      commissions: Number(sale.commission_value),
      cardFees: Number(sale.card_fee_value),
      finalPrice: Number(sale.total_value),
    }));
    return formattedSales;
  } catch (error: any) {}
}
