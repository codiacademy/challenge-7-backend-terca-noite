import { Sales } from "./../../../../frontend/src/types/types";
import z from "zod";
import type { FastifyInstance } from "fastify";
import { parse, subWeeks, startOfMonth, startOfYear, isWithinInterval, subMonths } from "date-fns";
import type { Sale } from "../../types/sales/sale-types.ts";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function";
import { AppError } from "../../utils/app-error";
// Estrutura para o Gráfico de Barras (Sales Types Data)
const barChartDataItemDoc = {
  type: "object",
  required: ["presencial", "online"],
  properties: {
    presencial: {
      type: "number",
      minimum: 0,
      description: "Total de vendas em cursos presenciais.",
    },
    online: { type: "number", minimum: 0, description: "Total de vendas em cursos online." },
  },
};

// Estrutura para o Gráfico de Pizza (Sales Courses Data)
const pieChartDataItemDoc = {
  type: "object",
  required: ["name", "value"],
  properties: {
    name: { type: "string", description: "Nome do curso." },
    value: { type: "number", minimum: 0, description: "Valor total das vendas para este curso." },
  },
};

// Estrutura para o Gráfico de Crescimento (Sales Growth Data)
const growthChartDataItemDoc = {
  type: "object",
  required: ["month", "totalSales"],
  properties: {
    month: { type: "string", description: "Mês/Ano formatado (ex: 'Jan 2024')." },
    totalSales: { type: "number", minimum: 0, description: "Total de vendas naquele mês." },
  },
};

// Estrutura da Resposta de Sucesso 200
const successResponseDoc = {
  type: "object",
  required: ["message", "barChartData", "pieChartData", "growthChartData"],
  properties: {
    message: {
      type: "string",
      example:
        "Dados para os Gráficos de 2024-01-01T00:00:00.000Z até 2024-01-31T00:00:00.000Z coletados com sucesso",
      description: "Mensagem de sucesso com os filtros de data aplicados.",
    },
    barChartData: {
      type: "array",
      description: "Dados de vendas por tipo de curso (Presencial vs Online).",
      items: barChartDataItemDoc,
    },
    pieChartData: {
      type: "array",
      description: "Dados de vendas por nome do curso (para gráfico de pizza/donut).",
      items: pieChartDataItemDoc,
    },
    growthChartData: {
      type: "array",
      description: "Dados de crescimento de vendas mensais.",
      items: growthChartDataItemDoc,
    },
  },
};

const getSalesChartsSchema = {
  tags: ["Vendas"],
  summary: "Retorna dados de vendas prontos para gráficos.",
  description:
    "Coleta dados de vendas do usuário autenticado, filtrados por um período opcional, e retorna conjuntos de dados para gráficos (tipos, cursos e crescimento mensal).",

  security: [{ bearerAuth: [] }],

  querystring: {
    type: "object",
    properties: {
      from: {
        type: "string",
        description: "Data inicial do período a ser filtrado (opcional).",
      },
      to: {
        type: "string",
        description: "Data final do período a ser filtrado (opcional).",
      },
    },
  },

  response: {
    200: {
      description: "Dados dos gráficos coletados e formatados com sucesso.",
      type: successResponseDoc.type,
      required: successResponseDoc.required,
      properties: successResponseDoc.properties,
    }, // Resposta para Erro de Autenticação

    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    }, // Resposta para Erro Interno (Zod ou DB)

    500: {
      description: "Erro interno do servidor",
      type: "object",
      properties: {
        error: { type: "string", example: "Erro ao listar vendas filtradas" },
      },
    },
  },
};
const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getSalesChartsDataRoute(app: FastifyInstance) {
  app.get(
    "/get_charts",
    {
      preHandler: [app.authenticate],
      schema: getSalesChartsSchema,
    },
    async (request, reply) => {
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
        if (error instanceof AppError) {
          type AppErrorStatusCode = 200 | 401 | 500;

          const statusCode = error.statusCode as AppErrorStatusCode;
          return reply.status(statusCode).send({
            message: error.message,
            code: error.statusCode,
          });
        }

        return reply.status(500).send({
          message: "Erro interno do servidor. Tente novamente mais tarde.",
        });
      }
    },
  );
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
