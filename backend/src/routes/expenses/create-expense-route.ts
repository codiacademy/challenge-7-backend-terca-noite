import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { createExpenseFunction } from "../../functions/expenses/create-expense-function";
import { zhCN } from "zod/locales";
import { parse, isValid } from "date-fns";

const createExpenseBodyDoc = {
  type: "object",
  properties: {
    date: {
      type: "string",
      description:
        "Data de vencimento ou pagamento da despesa (string, formato esperado: DD/MM/AAAA, mas não validado aqui).",
    },
    description: {
      type: "string",
      description: "Descrição da despesa (máx. 50 caracteres).",
    },
    category: {
      type: "string",
      enum: ["Fixa", "Variavel"],
      description: "Categoria da despesa.",
    },
    value: {
      type: "number",
      description: "Valor da despesa (deve ser maior que zero).",
    },
    status: {
      type: "string",
      enum: ["Pendente", "Pago"],
      description: "Status atual da despesa.",
    },
  },
  required: ["date", "description", "category", "value", "status"],
};

// Esquema de Despesa Criada (Retorno de 201)
const createdExpenseSchemaDoc = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    due_date: { type: "string", format: "date-time" },
    description: { type: "string" },
    category: { type: "string", enum: ["fixa", "variavel"] },
    value: { type: "number" },
    status: { type: "string", enum: ["pendente", "pago"] },
    created_at: { type: "string", format: "date-time" },
  },
  required: [
    "id",
    "userId",
    "due_date",
    "description",
    "category",
    "value",
    "status",
    "created_at",
  ],
};

// Esquema de Resposta de Sucesso (201 Created)
const createExpenseSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Despesa criada com sucesso",
      description: "Confirmação da criação do registro.",
    },
    createdExpense: createdExpenseSchemaDoc,
  },
  required: ["message", "createdExpense"],
};

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
    errors: {
      type: "array",
      description: "Detalhes dos erros de validação Zod (Ex: descrição vazia, valor negativo).",
    },
  },
};

// --- 3. ESQUEMA PRINCIPAL DA ROTA ---

const createExpenseSchema = {
  tags: ["Despesas"],
  summary: "Cria uma nova despesa para o usuário autenticado.",
  description:
    "Cria um novo registro de despesa no sistema, associado ao `userId` extraído do token de acesso.",
  operationId: "createExpense",

  security: [{ bearerAuth: [] }],

  body: createExpenseBodyDoc,

  response: {
    // ✅ 201 Created
    201: {
      description: "Despesa criada com sucesso.",
      ...createExpenseSuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "Dados de entrada inválidos (falha na validação Zod).",
      ...validationErrorResponseDoc,
    },
    // ❌ 401 Unauthorized
    401: {
      description: "Autenticação falhou (Token JWT ausente ou inválido).",
      ...authErrorResponseDoc,
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

  value: z.number().min(1, "O valor da despesa deve ser maior que zero"),

  status: z.enum(["Pendente", "Pago"], "Status inválido"),
});

const userIdSchema = z.uuid();

export async function createExpenseRoute(app: FastifyInstance) {
  app.post(
    "/create_expense",
    { preHandler: [app.authenticate], schema: createExpenseSchema },
    async (request, reply) => {
      try {
        const userId = userIdSchema.parse((request.user as any).id);
        const { date, description, category, value, status } = bodySchema.parse(request.body);

        const result = await createExpenseFunction({
          userId,
          date,
          description,
          category,
          value,
          status,
        });

        return reply.status(201).send({
          message: "Despesa criada com sucesso",
          createdExpense: result,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar criar despesa no DB");
        if (error instanceof AppError) {
          type AppErrorStatusCode = 401 | 201 | 400 | 500;

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
