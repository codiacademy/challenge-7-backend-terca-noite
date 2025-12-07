import type { CreateSaleData } from "../../types/sales/sale-types.ts";
import { prisma } from "../../lib/prisma";
import { CourseType } from "@prisma/client";
import { AppError } from "../../utils/app-error";
export async function createSaleFunction({
  userId,
  customer,
  course,
  discount,
  taxes,
  commissions,
  cardFees,
  finalPrice,
}: CreateSaleData) {
  try {
    const createdSale = await prisma.sale.create({
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
      select: {
        id: true,
        client_name: true,
        client_email: true,
        cpf: true,
        client_phone: true,
        course: true,
        course_type: true,
        course_value: true,
        discount_value: true,
        taxes_value: true,
        commission_value: true,
        card_fee_value: true,
        total_value: true,
        created_by: true,
      },
    });

    return createdSale;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    console.error("Erro operacional ao criar venda ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
