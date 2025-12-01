import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { updateExpenseFunction } from "../../functions/expenses/update-expense-function";

export const bodySchema = z.object({
  date: z.string().min(1, "A data de vencimento é obrigatória"),

  description: z
    .string()
    .min(1, "A descrição é obrigatória")
    .max(50, "Limite máximo de 50 caracteres"),

  category: z.enum(["Fixa", "Variavel"], "Categoria inválida"),

  value: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "O valor da despesa deve ser maior que zero"),
  ),

  status: z.enum(["Pendente", "Pago"], "Status inválido"),
});

export async function updateExpenseRoute(app: FastifyInstance) {
  app.put("/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { date, description, category, value, status } = bodySchema.parse(request.body);

      const updatedSale = await updateExpenseFunction({
        id,
        date,
        description,
        category,
        value,
        status,
      });

      return reply.status(200).send({
        message: "Despesa atualizada com sucesso",
        updatedSale,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar atualizar despesa no DB");
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
