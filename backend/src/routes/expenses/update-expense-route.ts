import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { updateExpenseFunction } from "../../functions/expenses/update-expense-function";

const updateExpenseBodyDoc = {
  type: "object",
  properties: {
    date: {
      type: "string",
      description: "Nova data de vencimento/pagamento. Formato: YYYY-MM-DD.",
    },
    description: { type: "string", description: "Nova descrição da despesa (máx. 50 caracteres)." },
    category: {
      type: "string",
      enum: ["Fixa", "Variavel"],
      description: "Nova categoria da despesa.",
    },
    value: { type: "number", description: "Novo valor da despesa (deve ser > 0)." },
    status: { type: "string", enum: ["Pendente", "Pago"], description: "Novo status da despesa." },
  },
  required: ["date", "description", "category", "value", "status"],
};

// Esquema dos Parâmetros da Rota
const updateExpenseParamsDoc = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID (UUID) da despesa a ser atualizada.",
    },
  },
  required: ["id"],
};

// Esquema de Despesa Atualizada (Reutilizado e adaptado para o retorno)
const updatedExpenseSchemaDoc = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    due_date: { type: "string", description: "Data de vencimento ou pagamento." },
    description: { type: "string" },
    category: { type: "string", enum: ["fixa", "variavel"] },
    value: { type: "number" },
    status: { type: "string", enum: ["pendente", "pago"] },
    createdAt: { type: "string", format: "date-time" },
  },
  required: ["id", "userId", "due_date", "description", "category", "value", "status", "createdAt"],
};

// Esquema de Resposta de Sucesso (200 OK)
const updateExpenseSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Despesa atualizada com sucesso",
      description: "Confirmação da atualização do registro.",
    },
    updatedSale: updatedExpenseSchemaDoc,
  },
  required: ["message", "updatedSale"],
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
    message: { type: "string", example: "Dados de entrada em formato inválido" },
    errors: { type: "array", description: "Detalhes dos erros de validação Zod." },
  },
};

const notFoundErrorResponseDoc = {
  type: "object",
  properties: {
    message: { type: "string", example: "Despesa não encontrada." },
    code: { type: "number", example: 404 },
  },
};

// --- 3. ESQUEMA PRINCIPAL DA ROTA ---

const updateExpenseSchema = {
  tags: ["Despesas"],
  summary: "Atualiza completamente uma despesa específica pelo seu id.",
  description:
    "Atualiza todos os dados de uma despesa cujo ID é fornecido na URL. Todos os campos do corpo da requisição são obrigatórios (PUT).",
  operationId: "updateExpense",

  security: [{ bearerAuth: [] }],

  params: updateExpenseParamsDoc,
  body: updateExpenseBodyDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "Despesa atualizada com sucesso.",
      ...updateExpenseSuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "Dados de entrada (body ou ID) em formato inválido.",
      ...validationErrorResponseDoc,
    },
    // ❌ 401 Unauthorized
    401: {
      description: "Autenticação falhou (Token JWT ausente/inválido).",
      ...authErrorResponseDoc,
    },
    // ❌ 404 Not Found
    404: {
      description: "Despesa não encontrada ou usuário sem permissão (via AppError).",
      ...notFoundErrorResponseDoc,
    },
    // ❌ 500 Internal Server Error
    500: {
      description: "Erro interno do servidor.",
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Erro interno do servidor. Tente novamente mais tarde.",
        },
      },
    },
  },
};

export const bodySchema = z.object({
  date: z.string().min(1, "A data de vencimento é obrigatória"),

  description: z
    .string()
    .min(1, "A descrição é obrigatória")
    .max(50, "Limite máximo de 50 caracteres"),

  category: z.enum(["Fixa", "Variavel"], "Categoria inválida"),

  value: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "O valor da despesa deve ser maior que zero"),
  ),

  status: z.enum(["Pendente", "Pago"], "Status inválido"),
});

export async function updateExpenseRoute(app: FastifyInstance) {
  app.put(
    "/:id",
    { preHandler: [app.authenticate], schema: updateExpenseSchema },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { date, description, category, value, status } = bodySchema.parse(request.body);

        const updatedSale = await updateExpenseFunction({
          id,
          date,
          description,
          category,
          value,
          status,
        });

        return reply.status(200).send({
          message: "Despesa atualizada com sucesso",
          updatedSale,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar despesa no DB");
        if (error instanceof AppError) {
          type AppErrorStatusCode = 401 | 404 | 200 | 400 | 500;

          const statusCode = error.statusCode as AppErrorStatusCode;
          return reply.status(statusCode).send({
            message: error.message,
            code: error.statusCode,
          });
        }
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            message: "Dados de entrada em formato inválido",
            errors: error.issues, // Retorna erros por campo
          });
        }

        return reply.status(500).send({
          message: "Erro interno do servidor. Tente novamente mais tarde.",
        });
      }
    },
  );
}
