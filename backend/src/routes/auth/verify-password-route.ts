import z from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { isPasswordCorrectFunction } from "../../functions/auth/is-password-correct-function";

const verifyPasswordBodyDoc = {
  type: "object",
  properties: {
    password: {
      type: "string",
      description: "A senha atual do usuário (mínimo de 8 caracteres) para verificação.",
    },
  },
  required: ["password"],
};

// Esquema de Resposta de Sucesso (200)
const verifyPasswordSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Verificação de senha realizada com sucesso",
      description: "Confirmação de que a operação foi executada.",
    },
    isPasswordCorrect: {
      type: "boolean",
      description:
        "Resultado da verificação: true se a senha estiver correta, false caso contrário.",
      example: true,
    },
  },
  required: ["message", "isPasswordCorrect"],
};

// --- 2. ESQUEMAS DE ERRO ---

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
    message: { type: "string", example: "Dados em formato inválido" },
    errors: {
      type: "array",
      description: "Detalhes dos erros de validação Zod (Ex: senha muito curta).",
    },
  },
};

// --- 3. ESQUEMA PRINCIPAL DA ROTA ---

const verifyPasswordSchema = {
  tags: ["Autenticação"],
  summary: "Verifica se a senha fornecida corresponde à senha do usuário autenticado.",
  description:
    "Rota protegida que recebe a senha e compara com a senha hash do usuário autenticado (o `userId` é extraído do token JWT). Útil para re-autenticação em operações sensíveis.",
  operationId: "verifyUserPassword",

  security: [{ bearerAuth: [] }],

  body: verifyPasswordBodyDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "Verificação da senha concluída.",
      ...verifyPasswordSuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "Dados de entrada inválidos (Formato do ID do usuário ou senha).",
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
const bodySchema = z.object({
  userId: z.uuid(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export async function verifyPasswordRoute(app: FastifyInstance) {
  app.post(
    "/verify_password",
    { preHandler: [app.authenticate], schema: verifyPasswordSchema },
    async (request, reply) => {
      try {
        const { userId, password } = bodySchema.parse({
          password: (request.body as any)?.password,
          userId: (request.user as any)?.id,
        });
        const isCorrect = await isPasswordCorrectFunction({ userId, password });
        return reply.status(200).send({
          message: "Verificação de senha realizada com sucesso",
          isPasswordCorrect: isCorrect,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar verificar senha no DB");
        if (error instanceof AppError) {
          type AppErrorStatusCode = 401 | 200 | 400 | 500;

          const statusCode = error.statusCode as AppErrorStatusCode;
          return reply.status(statusCode).send({
            message: error.message,
            code: error.statusCode,
          });
        }
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            message: "ID em formato inválidos",
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
