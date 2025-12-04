import z from "zod";
import type { FastifyInstance } from "fastify";
import { parse, subWeeks, startOfMonth, startOfYear, isWithinInterval, subMonths } from "date-fns";
import type { Sale } from "../../types/sales/sale-types.ts";
import type { Expense } from "../../types/expenses/expense-types.ts";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function";
import { readDateFilteredExpensesFunction } from "../../functions/expenses/read-date-filtered-expenses-function";

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getOverviewChartsDataRoute(app: FastifyInstance) {
  app.get("/get_charts", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;

      const filters = querySchema.parse(request.query);

      const dateFilteredSalesData = await readDateFilteredSalesFunction(userId, filters);
      const dateFilteredExpensesData = await readDateFilteredExpensesFunction(userId, filters);
      const normalizedSales = dateFilteredSalesData.sales.map((sale) => ({
        ...sale,
        created_at: new Date(sale.created_at),
        course_value: Number(sale.course_value),
        commission_value: Number(sale.course_value),
        taxes_value: Number(sale.course_value),
        discount_value: Number(sale.discount_value),
        card_fee_value: Number(sale.card_fee_value),
        total_value: Number(sale.total_value),
      }));

      const normalizedExpenses = dateFilteredExpensesData.expenses.map((expense) => ({
        ...expense,
        created_at: new Date(expense.created_at),
        value: Number(expense.value),
      }));
      const salesCoursesData = getSalesCoursesData(normalizedSales);
      const balanceData = getBalanceData(normalizedSales, normalizedExpenses);
      const salesGrowthData = getSalesGrowthData(normalizedSales);
      const balanceLineData = getBalanceDataGrowth(normalizedSales, normalizedExpenses);
      return reply.status(200).send({
        message: `Dados para os Gráficos de ${filters.from} até ${filters.to} coletados com sucesso`,
        barChartData: balanceData,
        pieChartData: salesCoursesData,
        growthChartData: salesGrowthData,
        lineChartData: balanceLineData,
        dateFilteredSales: normalizedSales,
      });
    } catch (error) {
      console.error("Erro ao mostrar todas as vendas do período:", error);
      return reply.status(500).send({ error: "Erro ao listar vendas filtradas" });
    }
  });
}

export const getSalesCoursesData = (sales: Sale[] = []) => {
  const totalsByCourse: { [key: string]: number } = {};
  sales.forEach((sale) => {
    const courseName = sale.course;
    totalsByCourse[courseName] = (totalsByCourse[courseName] || 0) + sale.total_value;
  });

  return Object.entries(totalsByCourse).map(([name, value]) => ({
    name,
    value,
  }));
};

export const getSalesGrowthData = (sales: Sale[] = []) => {
  const monthlyTotals: { [key: string]: number } = {};
  sales.forEach((sale) => {
    const date = sale.created_at;
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + sale.total_value;
  });

  return Object.entries(monthlyTotals)
    .map(([monthYear, totalSales]) => {
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
      const monthNumber = Math.max(1, Math.min(12, parseInt(month)));
      return {
        month: `${monthNames[monthNumber - 1]} ${year}`,
        totalSales,
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
        ].indexOf(m);

      return parseInt(aYear) - parseInt(bYear) || monthIndex(aMonth) - monthIndex(bMonth);
    });
};

interface BalanceData {
  receitas: number;
  despesas: number;
}
export const getBalanceData = (
  filteredSales: Sale[] | undefined,
  filteredExpenses: Expense[] | undefined,
): BalanceData[] => {
  if (
    !filteredSales ||
    !Array.isArray(filteredSales) ||
    !filteredExpenses ||
    !Array.isArray(filteredExpenses)
  ) {
    return [{ receitas: 0, despesas: 0 }];
  }

  const totalSales = filteredSales.reduce((acc, sale) => acc + sale.total_value, 0);
  const totalExpenses = filteredExpenses.reduce((acc, expense) => acc + expense.value, 0);

  const totals = {
    receitas: totalSales,
    despesas: totalExpenses,
  };

  return [totals];
};

export const getBalanceDataGrowth = (
  filteredSales: Sale[] | undefined,
  filteredExpenses: Expense[] | undefined,
) => {
  if (
    !filteredSales ||
    !Array.isArray(filteredSales) ||
    !filteredExpenses ||
    !Array.isArray(filteredExpenses)
  ) {
    return [];
  }

  const monthlySales: { [key: string]: number } = {};
  const monthlyExpenses: { [key: string]: number } = {};

  filteredSales.forEach((sale) => {
    const date = sale.created_at;
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlySales[monthYear] = (monthlySales[monthYear] || 0) + sale.total_value;
  });

  filteredExpenses.forEach((expense) => {
    const date = expense.due_date;
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyExpenses[monthYear] = (monthlyExpenses[monthYear] || 0) + expense.value;
  });

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

  const totals = Object.entries(monthlySales).map(([monthYear, totalSales]) => {
    const [year, month = "1"] = monthYear.split("-");

    const monthName = monthNames[parseInt(month) - 1];
    const totalExpenses = monthlyExpenses[monthYear] || 0;

    return {
      month: `${monthName} ${year}`, // Combinar mês e ano em uma única chave
      receitas: totalSales,
      despesas: totalExpenses,
    };
  });

  return totals.sort((a, b) => {
    const [aMonth = "1", aYear = "1"] = a.month.split(" ");
    const [bMonth = "1", bYear = "1"] = b.month.split(" ");
    const monthIndex = (m: string) => monthNames.indexOf(m);
    return parseInt(aYear) - parseInt(bYear) || monthIndex(aMonth) - monthIndex(bMonth);
  });
};
