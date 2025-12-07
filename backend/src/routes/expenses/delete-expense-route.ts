import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { deleteExpenseFunction } from "../../functions/expenses/delete-expense-function";

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

// Esquema de Resposta de Sucesso (200 OK)
const deleteExpenseSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Despesa deletada com sucesso",
      description: "Confirmação da exclusão do registro.",
    },
    // O retorno é o objeto que foi deletado (result)
    deletedExpense: expenseSchemaDoc,
  },
  required: ["message", "deletedExpense"],
};

// Esquema dos Parâmetros da Rota
const deleteExpenseParamsDoc = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID (UUID) da despesa a ser deletada.",
    },
  },
  required: ["id"],
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
    message: { type: "string", example: "ID de despesa em formato inválido" },
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

const deleteExpenseSchema = {
  tags: ["Despesas"],
  summary: "Deleta uma despesa específica pelo seu ID.",
  description:
    "Deleta a despesa cujo ID é fornecido na URL. Apenas o proprietário da despesa pode excluí-la (regra definida na função interna).",
  operationId: "deleteExpense",

  security: [{ bearerAuth: [] }],

  params: deleteExpenseParamsDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "Despesa deletada com sucesso.",
      ...deleteExpenseSuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "ID de despesa em formato inválido (falha na validação Zod).",
      ...validationErrorResponseDoc,
    },
    // ❌ 401 Unauthorized
    401: {
      description:
        "Autenticação falhou (Token JWT ausente/inválido) ou o usuário não tem permissão.",
      ...authErrorResponseDoc,
    },
    // ❌ 404 Not Found (Caso a despesa não exista ou não pertença ao usuário)
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

const saleIdSchema = z.uuid();

export async function deleteExpenseRoute(app: FastifyInstance) {
  app.delete(
    "/:id",
    { preHandler: [app.authenticate], schema: deleteExpenseSchema },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const expenseId = saleIdSchema.parse(id);
        const result = await deleteExpenseFunction(expenseId);

        return reply.status(200).send({
          message: "Despesa deletada com sucesso",
          deletedExpense: result,
        });
      } catch (error: any) {
        app.log.error(error, "Erro ao tentar deletar despesa no DB");
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
            message: "ID de despesa em formato inválido",
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
