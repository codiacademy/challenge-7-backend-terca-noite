import z from "zod";
import type { FastifyInstance } from "fastify";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function";
import { Sale } from "../../types/sales/sale-types";
import { AppError } from "../../utils/app-error";
// Estrutura para os KPIs (Key Performance Indicators)
const salesStatsDoc = {
  type: "object",
  required: ["totalCourses", "avarageSales", "grossValue", "netValue"],
  properties: {
    totalCourses: {
      type: "number",
      minimum: 0,
      description: "Número total de vendas (cursos vendidos) no período.",
    },
    avarageSales: {
      type: "number",
      minimum: 0,
      description: "Valor médio (líquido) das vendas no período.",
    },
    grossValue: {
      type: "number",
      minimum: 0,
      description: "Valor total bruto das vendas (soma dos course_value).",
    },
    netValue: {
      type: "number",
      minimum: 0,
      description: "Valor total líquido das vendas (soma dos total_value).",
    },
  },
};

// Estrutura da Resposta de Sucesso 200
const successResponseDoc = {
  type: "object",
  required: ["message", "salesStats"],
  properties: {
    message: {
      type: "string",
      example: "KPIs coletados com sucesso",
      description: "Mensagem de sucesso da coleta de dados.",
    },
    salesStats: salesStatsDoc,
  },
};

const getSalesKPIsSchema = {
  tags: ["Vendas"],
  summary: "Retorna os principais indicadores de desempenho (KPIs) de vendas.",
  description:
    "Calcula e retorna estatísticas agregadas (KPIs) das vendas do usuário, com filtros de data opcionais.",

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
      description: "KPIs coletados com sucesso.",
      type: successResponseDoc.type,
      required: successResponseDoc.required,
      properties: successResponseDoc.properties,
    }, // Resposta para Erro de Autenticação

    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    }, // Resposta para Erro Interno (DB ou Lógica)

    500: {
      description: "Erro interno do servidor",
      type: "object",
      properties: {
        error: { type: "string", example: "Erro ao coletar KPIs" },
      },
    },
  },
};

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getSalesKPIsRoute(app: FastifyInstance) {
  app.get(
    "/get_kpis",
    {
      preHandler: [app.authenticate],
      schema: getSalesKPIsSchema,
    },
    async (request, reply) => {
      try {
        const { id: userId } = request.user as any;

        const filters = request.query;

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
