import z from "zod";
import type { FastifyInstance } from "fastify";
import { readFilteredExpensesFunction } from "../../functions/expenses/read-filtered-expenses-function.ts";
const querySchema = z.object({
  category: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function readFilteredExpensesRoute(app: FastifyInstance) {
  app.get("/read_filtered_expenses", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;

      const filters = querySchema.parse(request.query);

      const result = await readFilteredExpensesFunction(userId, filters);

      return reply.status(200).send({
        message: "Despesas filtradas listadas com sucesso",
        ...result,
      });
    } catch (error) {
      console.error("Erro ao listar despesas filtradas:", error);
      return reply.status(500).send({ error: "Erro ao listar despesas filtradas" });
    }
  });
}
