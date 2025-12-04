import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { createExpenseFunction } from "../../functions/expenses/create-expense-function";
import { zhCN } from "zod/locales";
import { parse, isValid } from "date-fns";
export const bodySchema = z.object({
  date: z.string().min(1, "A data de vencimento é obrigatória"),

  description: z
    .string()
    .min(1, "A descrição é obrigatória")
    .max(50, "Limite máximo de 50 caracteres"),

  category: z.enum(["Fixa", "Variavel"], "Categoria inválida"),

  value: z.number().min(1, "O valor da despesa deve ser maior que zero"),

  status: z.enum(["Pendente", "Pago"], "Status inválido"),
});
const userIdSchema = z.uuid();

export async function createExpenseRoute(app: FastifyInstance) {
  app.post("/create_expense", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = userIdSchema.parse((request.user as any).id);
      const { date, description, category, value, status } = bodySchema.parse(request.body);

      const result = await createExpenseFunction({
        userId,
        date,
        description,
        category,
        value,
        status,
      });

      return reply.status(201).send({
        message: "Despesa criada com sucesso",
        createdExpense: result,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar criar despesa no DB");
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
