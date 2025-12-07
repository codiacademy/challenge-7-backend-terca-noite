import z from "zod";
import type { FastifyInstance } from "fastify";
import { readDateFilteredExpensesFunction } from "../../functions/expenses/read-date-filtered-expenses-function";

const expensesStatsDoc = {
  type: "object",
  description: "Estatísticas chave (KPIs) das despesas filtradas.",
  properties: {
    totalExpenses: {
      type: "number",
      example: 5500.0,
      description: "Soma total de todas as despesas (fixas + variáveis) no período.",
    },
    fixedExpenses: {
      type: "number",
      example: 3200.0,
      description: "Soma total das despesas de categoria 'fixa'.",
    },
    variableExpenses: {
      type: "number",
      example: 2300.0,
      description: "Soma total das despesas de categoria 'variavel'.",
    },
    pendingExpenses: {
      type: "number",
      example: 1500.0,
      description: "Soma total das despesas com status 'pendente'.",
    },
  },
  required: ["totalExpenses", "fixedExpenses", "variableExpenses", "pendingExpenses"],
};

// Esquema de Parâmetros de Query (Reutilizado do get_charts)
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

// Esquema de Resposta de Sucesso (200 OK)
const getKPIsSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "KPIs coletados com sucesso",
      description: "Mensagem de confirmação da coleta dos indicadores.",
    },
    expensesStats: expensesStatsDoc,
  },
  required: ["message", "expensesStats"],
};

// --- 2. ESQUEMAS DE ERRO (Reutilizados) ---

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

const getExpensesKPIsSchema = {
  tags: ["Despesas"],
  summary: "Obtém Key Performance Indicators (KPIs) das despesas do usuário.",
  description:
    "Calcula a soma total das despesas, a divisão entre fixas/variáveis e o total pendente. Suporta filtragem opcional por período de data via query parameters.",
  operationId: "getExpensesKPIs",

  security: [{ bearerAuth: [] }],

  querystring: getKPIsQueryDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "KPIs coletados e processados com sucesso.",
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

import type { Expense } from "@prisma/client";

export async function getExpensesKPIsRoute(app: FastifyInstance) {
  app.get(
    "/get_kpis",
    { preHandler: [app.authenticate], schema: getExpensesKPIsSchema },
    async (request, reply) => {
      try {
        const { id: userId } = request.user as any;

        const filters = querySchema.parse(request.query);

        const result = await readDateFilteredExpensesFunction(userId, filters);
        const filteredExpenses: Expense[] = result.expenses;
        const expensesStats = {
          totalExpenses: filteredExpenses.reduce(
            (sum: number, expense: Expense) => sum + Number(expense.value),
            0,
          ),
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
    },
  );
}
