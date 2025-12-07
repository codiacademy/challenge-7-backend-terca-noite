import z, { ZodType } from "zod";
import type { FastifyInstance } from "fastify";
import { readFilteredExpensesFunction } from "../../functions/expenses/read-filtered-expenses-function";

const emptyStringToUndefined = z.literal("").transform(() => undefined);

// 🎯 FUNÇÃO AUXILIAR CORRIGIDA: Aceita ZodType<string> (ou ZodEnum)
const optionalString = (schema: ZodType<string>) =>
  z.union([schema, emptyStringToUndefined]).optional();

const expenseSchemaDoc = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    created_by: { type: "string", format: "uuid" },
    due_date: { type: "string", description: "Data de vencimento ou pagamento." },
    description: { type: "string" },
    category: { type: "string", enum: ["fixa", "variavel"] },
    value: { type: "number" },
    status: { type: "string", enum: ["pendente", "pago"] },
    created_at: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "created_by",
    "due_date",
    "description",
    "category",
    "value",
    "status",
    "created_at",
  ],
};

// Esquema de Metadados de Paginação
const paginationMetadataDoc = {
  type: "object",
  properties: {
    currentPage: { type: "number", example: 1, description: "Página atual retornada." },
    totalPages: { type: "number", example: 5, description: "Número total de páginas disponíveis." },
    totalItems: {
      type: "number",
      example: 45,
      description: "Número total de itens (despesas) que correspondem ao filtro.",
    },
    limit: { type: "number", example: 10, description: "Número máximo de itens por página." },
  },
  required: ["currentPage", "totalPages", "totalItems", "limit"],
};

// Esquema de Parâmetros de Query
const readExpensesQueryDoc = {
  type: "object",
  properties: {
    category: {
      type: "string",
      description: "Filtro opcional por categoria.",
    },
    status: {
      type: "string",
      description: "Filtro opcional por status.",
    },
    search: {
      type: "string",
      description: "Busca opcional por texto na descrição.",
    },
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
    page: {
      type: "integer",
      description: "Número da página a ser retornada (padrão: 1).",
      default: 1,
    },
    limit: {
      type: "integer",
      description: "Número de itens por página (padrão: 10, máximo: 50).",
      default: 10,
    },
  },
};

// Esquema de Resposta de Sucesso (200 OK)
const readExpensesSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Despesas filtradas listadas com sucesso",
      description: "Mensagem de confirmação da listagem.",
    },
    expenses: {
      type: "array",
      items: expenseSchemaDoc,
      description: "Lista de despesas que correspondem aos filtros e paginação.",
    },
    pagination: paginationMetadataDoc,
  },
  required: ["message", "expenses", "pagination"],
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
    message: { type: "string", example: "Parâmetros de query inválidos" },
    errors: { type: "array", description: "Detalhes dos erros de validação Zod." },
  },
};

// --- 3. ESQUEMA PRINCIPAL DA ROTA ---

const readFilteredExpensesSchema = {
  tags: ["Despesas"],
  summary: "Lista despesas do usuário com filtros, busca e paginação.",
  description:
    "Retorna uma lista paginada de despesas, permitindo filtros por categoria, status, intervalo de datas e busca textual na descrição.",
  operationId: "readFilteredExpenses",

  security: [{ bearerAuth: [] }],

  querystring: readExpensesQueryDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "Lista de despesas filtradas e paginadas.",
      ...readExpensesSuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "Parâmetros de query em formato inválido.",
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
        error: { type: "string", example: "Erro ao listar despesas filtradas" },
      },
    },
  },
};

const querySchema = z.object({
  category: optionalString(z.enum(["fixa", "variavel"])), // Agora permite "" ou omitido
  status: optionalString(z.enum(["pendente", "pago"])), // Agora permite "" ou omitido
  search: optionalString(z.string()), // Agora permite "" ou omitido
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function readFilteredExpensesRoute(app: FastifyInstance) {
  app.get(
    "/read_filtered_expenses",
    { preHandler: [app.authenticate], schema: readFilteredExpensesSchema },
    async (request, reply) => {
      try {
        const { id: userId } = request.user as any;

        const filters = querySchema.parse(request.query);

        const result = await readFilteredExpensesFunction(userId, filters);

        return reply.status(200).send({
          message: "Despesas filtradas listadas com sucesso",
          expenses: result.expenses, // Retorna o array de despesas
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            limit: result.limit,
          },
        });
      } catch (error) {
        console.error("Erro ao listar despesas filtradas:", error);
        return reply.status(500).send({ error: "Erro ao listar despesas filtradas" });
      }
    },
  );
}
