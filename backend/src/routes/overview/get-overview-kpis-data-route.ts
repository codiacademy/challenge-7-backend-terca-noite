import z from "zod";
import type { FastifyInstance } from "fastify";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function";
import { readDateFilteredExpensesFunction } from "../../functions/expenses/read-date-filtered-expenses-function";
const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getOverviewKPIsRoute(app: FastifyInstance) {
  app.get("/get_kpis", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;

      const filters = querySchema.parse(request.query);

      const salesResult = await readDateFilteredSalesFunction(userId, filters);
      const expensesResult = await readDateFilteredExpensesFunction(userId, filters);
      const filteredSales = salesResult.sales;
      const filteredExpenses = expensesResult.expenses;

      const balanceStats = {
        totalExpenses: filteredExpenses.reduce((sum, expense) => sum + Number(expense.value), 0), // total de despesas
        totalSales: filteredSales.reduce((sum, sale) => sum + Number(sale.total_value), 0), // total de vendas
        balance:
          filteredSales.reduce((sum, sale) => sum + Number(sale.total_value), 0) -
          filteredExpenses.reduce((sum, expense) => sum + Number(expense.value), 0), // saldo
        avarageSales:
          filteredSales.length > 0
            ? filteredSales.reduce((sum, sale) => sum + Number(sale.total_value), 0) /
              filteredSales.length
            : 0, // média de vendas
      };

      return reply.status(200).send({
        message: "KPIs coletados com sucesso",
        balanceStats,
      });
    } catch (error) {
      console.error("Erro ao coletar KPIs:", error);
      return reply.status(500).send({ error: "Erro ao coletar KPIs" });
    }
  });
}
