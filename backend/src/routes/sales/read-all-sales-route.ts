import type { FastifyInstance } from "fastify";
import { readAllSalesFunction } from "../../functions/sales/read-all-sales-function.ts";
import { z } from "zod";
const userIdSchema = z.uuid();

export async function readAllSalesRoute(app: FastifyInstance) {
  app.get("/read_all_sales", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const userId = userIdSchema.parse((request.user as any).id);
      const salesData = await readAllSalesFunction(userId);

      return reply.status(200).send({
        message: "Todas as vendas listadas com sucesso",
        salesData,
      });
    } catch (error) {
      console.error("Erro ao listar vendas:", error);
      return reply.status(500).send({ error: "Erro ao listar vendas" });
    }
  });
}
