import z from "zod";
import type { FastifyInstance } from "fastify";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function.ts";

const querySchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});

export async function readDateFilteredSalesRoute(app: FastifyInstance) {
  app.get(
    "/read_date_filtered_sales",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      try {
        const { id: userId } = request.user as any;

        const filters = querySchema.parse(request.query);

        const result = await readDateFilteredSalesFunction(userId, filters);

        return reply.status(200).send({
          message: `Vendas do Período de ${filters.from} até ${filters.to}  mostradas com sucesso`,
          ...result,
        });
      } catch (error) {
        console.error("Erro ao mostrar todas as vendas do período:", error);
        return reply.status(500).send({ error: "Erro ao listar vendas filtradas" });
      }
    },
  );
}
