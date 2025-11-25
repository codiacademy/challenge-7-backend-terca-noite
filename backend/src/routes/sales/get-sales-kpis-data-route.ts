import z from "zod";
import type { FastifyInstance } from "fastify";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function.ts";
const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getSalesKPIsRoute(app: FastifyInstance) {
  app.get("/get_kpis", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;

      const filters = querySchema.parse(request.query);

      const result = await readDateFilteredSalesFunction(userId, filters);
      const filteredSales = result.sales;
      const salesStats = {
        totalCourses: filteredSales.length,
        avarageSales:
          filteredSales.length > 0
            ? filteredSales.reduce((sum, sale) => sum + Number(sale.total_value), 0) /
              filteredSales.length
            : 0,
        grossValue: filteredSales.reduce((sum, sale) => sum + Number(sale.course_value), 0),
        netValue: filteredSales.reduce((sum, sale) => sum + Number(sale.total_value), 0),
      };

      return reply.status(200).send({
        message: "KPIs coletados com sucesso",
        salesStats,
      });
    } catch (error) {
      console.error("Erro ao coletar KPIs:", error);
      return reply.status(500).send({ error: "Erro ao coletar KPIs" });
    }
  });
}
