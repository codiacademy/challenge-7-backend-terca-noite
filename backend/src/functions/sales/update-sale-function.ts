import type { ChangeSaleData } from "../../types/sales/sale-types.ts";
import { prisma } from "../../lib/prisma";
import { CourseType } from "@prisma/client";
import { AppError } from "../../utils/app-error";
export async function updateSaleFunction({
  id,
  userId,
  customer,
  course,
  discount,
  taxes,
  commissions,
  cardFees,
  finalPrice,
}: ChangeSaleData) {
  try {
    const existingSale = await prisma.sale.findUnique({
      where: {
        id,
      },
    });
    if (!existingSale) throw new AppError("Venda não consta no banco de dados.", 401);

    const updatedSale = await prisma.sale.update({
      where: {
        id,
      },
      data: {
        client_name: customer.name,
        cpf: customer.cpf,
        client_phone: customer.phone,
        client_email: customer.email,
        course: course.name,
        course_type: course.type,
        course_value: course.price,
        discount_value: discount,
        taxes_value: taxes,
        commission_value: commissions,
        card_fee_value: cardFees,
        total_value: finalPrice,
        created_by: userId,
      },
    });

    return updatedSale;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error("Erro operacional ao atualizar venda ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
