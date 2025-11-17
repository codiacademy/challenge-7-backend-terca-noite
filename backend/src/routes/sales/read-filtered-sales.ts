import z from "zod";
import type { FastifyInstance } from "fastify";
import { readFilteredSalesFunction } from "../../functions/sales/read-filtered-sales-function.ts";

const querySchema = z.object({
  courseType: z.enum(["online", "presencial"]).optional(),
  search: z.string().optional(),
  from: z.date().optional(),
  to: z.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function readFilteredSalesRoute(app: FastifyInstance) {
  app.get("/read_filtered_sales", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;

      const filters = querySchema.parse(request.query);

      const result = await readFilteredSalesFunction(userId, filters);

      return reply.status(200).send({
        message: "Vendas filtradas listadas com sucesso",
        ...result,
      });
    } catch (error) {
      console.error("Erro ao listar vendas filtradas:", error);
      return reply.status(500).send({ error: "Erro ao listar vendas filtradas" });
    }
  });
}
