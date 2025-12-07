import z from "zod";
import type { FastifyInstance } from "fastify";
import type { Expense } from "../../types/expenses/expense-types";
import { readDateFilteredExpensesFunction } from "../../functions/expenses/read-date-filtered-expenses-function";

const expensesTypesDataDoc = {
  type: "array",
  description:
    "Dados agregados de despesas por tipo (Fixa/Variável) para gráficos de barra ou pizza.",
  items: {
    type: "object",
    properties: {
      fixas: {
        type: "number",
        example: 1200.5,
        description: "Total de despesas Fixas no período.",
      },
      variaveis: {
        type: "number",
        example: 850.2,
        description: "Total de despesas Variáveis no período.",
      },
    },
    required: ["fixas", "variaveis"],
  },
};

// Esquema de Dados de Crescimento (Growth Chart / Linha)
const expensesGrowthDataDoc = {
  type: "array",
  description: "Dados agregados de despesas mensais para gráfico de crescimento (linha).",
  items: {
    type: "object",
    properties: {
      month: { type: "string", example: "Nov 2023", description: "Mês e ano." },
      totalExpenses: { type: "number", example: 1050.75, description: "Total de despesas no mês." },
    },
    required: ["month", "totalExpenses"],
  },
};

// Esquema de Parâmetros de Query
const getChartsQueryDoc = {
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
const getChartsSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Dados para os Gráficos de 2023-01-01 até 2023-12-31 coletados com sucesso",
      description: "Mensagem de confirmação da coleta de dados.",
    },
    barChartData: expensesTypesDataDoc,
    pieChartData: expensesTypesDataDoc, // O mesmo formato do barChart
    growthChartData: expensesGrowthDataDoc,
  },
  required: ["message", "barChartData", "pieChartData", "growthChartData"],
};

// --- 2. ESQUEMAS DE ERRO (Reutilizados/Adaptados) ---

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

const getExpensesChartsDataSchema = {
  tags: ["Despesas"],
  summary: "Obtém dados agregados de despesas para visualização em gráficos.",
  description:
    "Lista despesas do usuário (opcionalmente filtradas por período de data) e as transforma em formatos adequados para gráficos de barra, pizza e crescimento mensal.",
  operationId: "getExpensesChartsData",

  security: [{ bearerAuth: [] }],

  querystring: getChartsQueryDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "Dados dos gráficos coletados e processados com sucesso.",
      ...getChartsSuccessResponseDoc,
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
        error: { type: "string", example: "Erro ao listar despesas em gráficos" },
      },
    },
  },
};

const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getExpensesChartsDataRoute(app: FastifyInstance) {
  app.get(
    "/get_charts",
    { preHandler: [app.authenticate], schema: getExpensesChartsDataSchema },
    async (request, reply) => {
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
    },
  );
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
