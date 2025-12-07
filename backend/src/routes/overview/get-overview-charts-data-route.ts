import z from "zod";
import type { FastifyInstance } from "fastify";
import { parse, subWeeks, startOfMonth, startOfYear, isWithinInterval, subMonths } from "date-fns";
import type { Sale } from "../../types/sales/sale-types.ts";
import type { Expense } from "../../types/expenses/expense-types.ts";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function";
import { readDateFilteredExpensesFunction } from "../../functions/expenses/read-date-filtered-expenses-function";

const normalizedSaleSchemaDoc = {
  type: "object",
  description: "Estrutura simplificada de um objeto de Venda (após normalização de valores).",
  properties: {
    id: { type: "string", format: "uuid" },
    // ... Outras propriedades da Sale (omitidas para brevidade na documentação, mas implicadas)
    course_value: { type: "number", description: "Valor do curso." },
    commission_value: { type: "number", description: "Valor da comissão." },
    taxes_value: { type: "number", description: "Valor dos impostos." },
    discount_value: { type: "number", description: "Valor do desconto." },
    card_fee_value: { type: "number", description: "Taxa do cartão." },
    total_value: { type: "number", description: "Valor total líquido da venda." },
    created_at: { type: "string", format: "date-time" },
  },
  // Nota: Omitindo 'required' para manter a clareza, mas implicando todas as chaves mapeadas.
};

// Esquema de Parâmetros de Query (Filtro de Data)
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

// Dados do Gráfico 1: getBalanceData (Receitas vs. Despesas - Bar Chart)
const balanceDataDoc = {
  type: "array",
  description: "Total de Receitas vs. Despesas no período filtrado (para Bar Chart).",
  items: {
    type: "object",
    properties: {
      receitas: { type: "number", example: 10000.0, description: "Soma total das Receitas." },
      despesas: { type: "number", example: 4500.0, description: "Soma total das Despesas." },
    },
    required: ["receitas", "despesas"],
  },
};

// Dados do Gráfico 2: getSalesCoursesData (Vendas por Curso - Pie Chart)
const salesCoursesDataDoc = {
  type: "array",
  description: "Total de vendas agrupado por curso (para Pie Chart).",
  items: {
    type: "object",
    properties: {
      name: { type: "string", example: "Curso de React" },
      value: { type: "number", example: 5000.0 },
    },
    required: ["name", "value"],
  },
};

// Dados do Gráfico 3: getSalesGrowthData (Crescimento de Vendas - Growth Chart)
const salesGrowthDataDoc = {
  type: "array",
  description:
    "Vendas totais por mês/período para acompanhamento de crescimento (para Growth Chart).",
  items: {
    type: "object",
    properties: {
      month: { type: "string", example: "Mar 2023", description: "Mês e ano agrupados." },
      totalSales: {
        type: "number",
        example: 1200.0,
        description: "Total de vendas líquidas no mês.",
      },
    },
    required: ["month", "totalSales"],
  },
};

// Dados do Gráfico 4: getBalanceDataGrowth (Crescimento de Saldo - Line Chart)
const balanceLineDataDoc = {
  type: "array",
  description: "Receitas vs. Despesas agregadas por mês/período (para Line Chart).",
  items: {
    type: "object",
    properties: {
      month: { type: "string", example: "Mar 2023", description: "Mês e ano agrupados." },
      receitas: { type: "number", example: 1500.0, description: "Total de receitas no mês." },
      despesas: { type: "number", example: 700.0, description: "Total de despesas no mês." },
    },
    required: ["month", "receitas", "despesas"],
  },
};

// Esquema de Resposta de Sucesso (200 OK)
const getOverviewSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Dados para os Gráficos de 2023-01-01 até 2023-12-31 coletados com sucesso",
      description: "Mensagem de confirmação da coleta de dados.",
    },
    barChartData: balanceDataDoc,
    pieChartData: salesCoursesDataDoc,
    growthChartData: salesGrowthDataDoc,
    lineChartData: balanceLineDataDoc,
    dateFilteredSales: {
      type: "array",
      items: normalizedSaleSchemaDoc,
      description: "Lista de objetos de vendas normalizados, filtrados pelo período.",
    },
  },
  required: [
    "message",
    "barChartData",
    "pieChartData",
    "growthChartData",
    "lineChartData",
    "dateFilteredSales",
  ],
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

const getOverviewChartsDataSchema = {
  tags: ["Visão Geral"], // TAG SOLICITADA
  summary: "Obtém todos os dados de vendas e despesas necessários para os gráficos da Visão Geral.",
  description:
    "Consolida vendas e despesas, aplicando filtros de data, e retorna quatro conjuntos de dados para visualização em gráficos: Saldo, Vendas por Curso, Crescimento de Vendas e Crescimento de Saldo.",
  operationId: "getOverviewChartsData",

  security: [{ bearerAuth: [] }],

  querystring: getChartsQueryDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "Dados dos gráficos de Visão Geral coletados e processados com sucesso.",
      ...getOverviewSuccessResponseDoc,
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
        error: { type: "string", example: "Erro ao listar vendas filtradas" },
      },
    },
  },
};
const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function getOverviewChartsDataRoute(app: FastifyInstance) {
  app.get(
    "/get_charts",
    { preHandler: [app.authenticate], schema: getOverviewChartsDataSchema },
    async (request, reply) => {
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
        console.error("Erro ao mostrar todos os dados para gráficos de visão geral", error);
        return reply
          .status(500)
          .send({ error: "Erro ao listar dados para gráficos de visão geral" });
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
