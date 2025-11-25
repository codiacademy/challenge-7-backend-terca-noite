import z from "zod";
import type { FastifyInstance } from "fastify";
import { readDateFilteredExpensesFunction } from "../../functions/expenses/read-date-filtered-expenses-function.ts";
const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getExpensesKPIsRoute(app: FastifyInstance) {
  app.get("/get_kpis", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;

      const filters = querySchema.parse(request.query);

      const result = await readDateFilteredExpensesFunction(userId, filters);
      const filteredExpenses = result.expenses;
      const expensesStats = {
        totalExpenses: filteredExpenses.reduce((sum, expense) => sum + Number(expense.value), 0),
        fixedExpenses: filteredExpenses
          .filter((expense) => expense.category === "fixa")
          .reduce((sum, expense) => sum + Number(expense.value), 0),
        variableExpenses: filteredExpenses
          .filter((expense) => expense.category === "variavel")
          .reduce((sum, expense) => sum + Number(expense.value), 0),
        pendingExpenses: filteredExpenses
          .filter((expense) => expense.status === "pendente")
          .reduce((sum, expense) => sum + Number(expense.value), 0),
      };

      return reply.status(200).send({
        message: "KPIs coletados com sucesso",
        expensesStats,
      });
    } catch (error) {
      console.error("Erro ao coletar KPIs:", error);
      return reply.status(500).send({ error: "Erro ao coletar KPIs" });
    }
  });
}
