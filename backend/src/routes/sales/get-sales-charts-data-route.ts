import z from "zod";
import type { FastifyInstance } from "fastify";
import { parse, subWeeks, startOfMonth, startOfYear, isWithinInterval, subMonths } from "date-fns";
import type { Sale } from "../../types/sales/sale-types.ts";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function.ts";

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getSalesChartsDataRoute(app: FastifyInstance) {
  app.get("/get_charts", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;

      const filters = querySchema.parse(request.query);

      const dateFilteredData = await readDateFilteredSalesFunction(userId, filters);
      const normalizedSales = dateFilteredData.sales.map((sale) => ({
        ...sale,
        created_at: new Date(sale.created_at),
        course_value: Number(sale.course_value),
        commission_value: Number(sale.course_value),
        taxes_value: Number(sale.course_value),
        discount_value: Number(sale.discount_value),
        card_fee_value: Number(sale.card_fee_value),
        total_value: Number(sale.total_value),
      }));
      const salesCoursesData = getSalesCoursesData(normalizedSales);
      const salesTypesData = getSalesTypesData(normalizedSales);
      const salesGrowthData = getSalesGrowthData(normalizedSales);
      return reply.status(200).send({
        message: `Dados para os Gráficos de ${filters.from} até ${filters.to} coletados com sucesso`,
        barChartData: salesTypesData,
        pieChartData: salesCoursesData,
        growthChartData: salesGrowthData,
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

export const getSalesTypesData = (sales: Sale[] = []) => {
  const totals = sales.reduce(
    (acc, sale) => {
      if (sale.course_type === "presencial") {
        acc.presencial += sale.total_value;
      } else {
        acc.online += sale.total_value;
      }
      return acc;
    },
    { presencial: 0, online: 0 },
  );

  return [{ presencial: totals.presencial, online: totals.online }];
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
