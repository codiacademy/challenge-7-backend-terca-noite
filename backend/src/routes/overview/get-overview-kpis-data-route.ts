import z from "zod";
import type { FastifyInstance } from "fastify";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function";
import { readDateFilteredExpensesFunction } from "../../functions/expenses/read-date-filtered-expenses-function";
import type { Sale, Expense } from "@prisma/client";

const getKPIsQueryDoc = {
  type: "object",
  properties: {
    from: {
      type: "string",
      format: "date",
      description: "Data de início do filtro (opcional). Espera o formato YYYY-MM-DD.",
    },
    to: {
      type: "string",
      format: "date",
      description: "Data de fim do filtro (opcional). Espera o formato YYYY-MM-DD.",
    },
  },
};

// Esquema de Resposta de KPIs
const balanceStatsDoc = {
  type: "object",
  properties: {
    totalExpenses: {
      type: "number",
      example: 4500.0,
      description: "Soma total das despesas (Expense.value) no período.",
    },
    totalSales: {
      type: "number",
      example: 10000.0,
      description: "Soma total das vendas (Sale.total_value) no período.",
    },
    balance: {
      type: "number",
      example: 5500.0,
      description: "Saldo líquido (Total Sales - Total Expenses).",
    },
    avarageSales: {
      type: "number",
      example: 500.0,
      description: "Média do valor de venda por transação no período.",
    },
  },
  required: ["totalExpenses", "totalSales", "balance", "avarageSales"],
};

// Esquema de Resposta de Sucesso (200 OK)
const getKPIsSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "KPIs coletados com sucesso",
      description: "Mensagem de confirmação da coleta de dados.",
    },
    balanceStats: balanceStatsDoc,
  },
  required: ["message", "balanceStats"],
};

// --- 2. ESQUEMAS DE ERRO (Reutilizados do Canvas) ---

const authErrorResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Unauthorized",
      description: "Mensagem de erro de autenticação (Token ausente ou inválido).",
    },
    code: {
      type: "number",
      example: 401,
      description: "Código de status HTTP.",
    },
  },
};

const validationErrorResponseDoc = {
  type: "object",
  properties: {
    message: { type: "string", example: "Parâmetros de data inválidos" },
    errors: { type: "array", description: "Detalhes dos erros de validação Zod." },
  },
};

// --- 3. ESQUEMA PRINCIPAL DA ROTA ---

const getOverviewKPIsSchema = {
  tags: ["Visão Geral"],
  summary: "Obtém os Indicadores Chave de Desempenho (KPIs) financeiros de Visão Geral.",
  description:
    "Rota protegida que calcula os KPIs financeiros (receitas totais, despesas totais, saldo e ticket médio de venda) para o período opcionalmente filtrado pelas datas 'from' e 'to'.",
  operationId: "getOverviewKPIs",

  security: [{ bearerAuth: [] }],

  querystring: getKPIsQueryDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "KPIs calculados e retornados com sucesso.",
      ...getKPIsSuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "Parâmetros de query (datas) em formato inválido.",
      ...validationErrorResponseDoc,
    },
    // ❌ 401 Unauthorized
    401: {
      description: "Autenticação falhou (Token JWT ausente/inválido).",
      ...authErrorResponseDoc,
    },
    // ❌ 500 Internal Server Error
    500: {
      description: "Erro interno do servidor.",
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

export async function getOverviewKPIsRoute(app: FastifyInstance) {
  app.get(
    "/get_kpis",
    { preHandler: [app.authenticate], schema: getOverviewKPIsSchema },
    async (request, reply) => {
      try {
        const { id: userId } = request.user as any;

        const filters = querySchema.parse(request.query);

        const salesResult = await readDateFilteredSalesFunction(userId, filters);
        const expensesResult = await readDateFilteredExpensesFunction(userId, filters);
        const filteredSales: Sale[] = salesResult.sales;
        const filteredExpenses: Expense[] = expensesResult.expenses;

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
    },
  );
}
