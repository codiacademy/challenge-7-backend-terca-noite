import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { createSaleFunction } from "../../functions/sales/create-sale-function";
export const bodySchema = z.object({
  customer: z.object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .nonempty("Nome completo é obrigatório"),

    email: z.email("E-mail inválido").nonempty("E-mail é obrigatório"),

    phone: z
      .string()
      .regex(/^\d{11}$/, "Telefone inválido (ex: (11) 9 9999-9999)")
      .nonempty("Telefone é obrigatório"),

    cpf: z
      .string()
      .nonempty("CPF é obrigatório")
      .min(11)
      .max(11, "CPF deve estar no formato correto"),
  }),

  course: z.object({
    type: z.enum(["presencial", "online"] as const, {
      message: "Tipo de curso inválido",
    }),

    name: z.string().nonempty("Curso é obrigatório"),

    price: z.number().min(0, "Valor do curso deve ser maior ou igual a 0"),
  }),

  discount: z.number().min(0, "Desconto deve ser maior ou igual a 0"),

  taxes: z.number().min(0, "Impostos devem ser maiores ou iguais a 0"),

  commissions: z.number().min(0, "Comissões devem ser maiores ou iguais a 0"),

  cardFees: z.number().min(0, "Taxas de cartão devem ser maiores ou iguais a 0"),

  finalPrice: z.number().min(0, "Valor final deve ser maior ou igual a 0"),
});

const userIdSchema = z.uuid();

export async function createSaleRoute(app: FastifyInstance) {
  app.post("/create_sale", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = userIdSchema.parse((request.user as any).id);
      const { customer, course, discount, taxes, commissions, cardFees, finalPrice } =
        bodySchema.parse(request.body);

      const result = await createSaleFunction({
        userId,
        customer,
        course,
        discount,
        taxes,
        commissions,
        cardFees,
        finalPrice,
      });

      return reply.status(201).send({
        message: "Venda criada com sucesso",
        createdSale: result,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar criar venda no DB");
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Dados de entrada em formato inválido",
          errors: error.issues, // Retorna erros por campo
        });
      }

      return reply.status(500).send({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  });
}
