import z from "zod";
import type { FastifyInstance } from "fastify";
import type { Expense } from "../../types/expenses/expense-types.ts";
import { readDateFilteredExpensesFunction } from "../../functions/expenses/read-date-filtered-expenses-function.ts";

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getExpensesChartsDataRoute(app: FastifyInstance) {
  app.get("/get_charts", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;

      const filters = querySchema.parse(request.query);

      const dateFilteredData = await readDateFilteredExpensesFunction(userId, filters);
      const normalizedExpenses = dateFilteredData.expenses.map((expense) => ({
        ...expense,
        created_at: new Date(expense.created_at),
        value: Number(expense.value),
      }));
      const expensesTypesData = getExpensesTypesData(normalizedExpenses);
      const expensesGrowthData = getExpensesGrowthData(normalizedExpenses);
      return reply.status(200).send({
        message: `Dados para os Gráficos de ${filters.from} até ${filters.to} coletados com sucesso`,
        barChartData: expensesTypesData,
        pieChartData: expensesTypesData,
        growthChartData: expensesGrowthData,
      });
    } catch (error) {
      console.error("Erro ao mostrar todas as despesas em gráficos no período:", error);
      return reply.status(500).send({ error: "Erro ao listar despesas em gráficos" });
    }
  });
}

export const getExpensesTypesData = (expenses: Expense[]) => {
  // Somar totais por categoria
  const totals = expenses.reduce(
    (acc, expense) => {
      if (expense.category.toLowerCase() === "fixa") {
        acc.fixas += expense.value;
      } else if (expense.category.toLowerCase() === "variavel") {
        acc.variaveis += expense.value;
      }
      return acc;
    },
    { fixas: 0, variaveis: 0 },
  );

  // Retornar um array com um único objeto
  return [totals];
};

export const getExpensesGrowthData = (expenses: Expense[]) => {
  // Agrupar por mês
  const monthlyTotals: { [key: string]: number } = {};
  expenses.forEach((expense) => {
    const date = expense.due_date; // Converte a data para um objeto Date
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`; // Pega o mes e ano
    monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + expense.value; // Soma o valor da despesa
  });

  // Converter para formato do gráfico
  return Object.entries(monthlyTotals)
    .map(([monthYear, totalExpenses]) => {
      const [year, month = "1"] = monthYear.split("-");
      const monthNames = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];
      return {
        month: `${monthNames[parseInt(month) - 1]} ${year}`, // Adiciona o ano ao mês ex: "Jan 2023"
        totalExpenses,
      };
    })
    .sort((a, b) => {
      const [aMonth = "1", aYear = "1"] = a.month.split(" ");
      const [bMonth = "1", bYear = "1"] = b.month.split(" ");
      const monthIndex = (m: string) =>
        [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez",
        ].indexOf(m); // Funcao para pegar o index do mes
      return (
        parseInt(aYear) - parseInt(bYear) || monthIndex(aMonth) - monthIndex(bMonth) // Se os anos forem iguais, compara os meses
      );
    });
};
