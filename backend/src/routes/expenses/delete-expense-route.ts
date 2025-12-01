import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { deleteExpenseFunction } from "../../functions/expenses/delete-expense-function";
const saleIdSchema = z.uuid();
export async function deleteExpenseRoute(app: FastifyInstance) {
  app.delete("/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const expenseId = saleIdSchema.parse(id);
      const result = await deleteExpenseFunction(expenseId);

      return reply.status(200).send({
        message: "Despesa deletada com sucesso",
        user: result,
      });
    } catch (error: any) {
      app.log.error(error, "Erro ao tentar deletar despesa no DB");
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "ID de despesa em formato inválido",
          errors: error.issues, // Retorna erros por campo
        });
      }

      return reply.status(500).send({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  });
}
