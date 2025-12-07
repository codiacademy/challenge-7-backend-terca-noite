import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { updateUserPasswordFunction } from "../../functions/users/update-user-password-function";

const bodySchemaDoc = {
  type: "object",
  required: ["password"],
  properties: {
    password: {
      type: "string",
      description: "A nova senha do usuário (mínimo 8 caracteres).",
    },
  },
};

// Documentação Swagger (OpenAPI) para a rota PATCH
const updatePasswordSchema = {
  summary: "Atualiza a senha do usuário atualmente autenticado.",
  description:
    "Esta rota permite que o usuário autenticado defina uma nova senha. O ID do usuário é obtido do token JWT.",
  tags: ["Usuários"],

  // Esquema de segurança (Fastify/OpenAPI)
  security: [{ bearerAuth: [] }],

  // Definição do corpo da requisição
  body: bodySchemaDoc,

  response: {
    200: {
      description: "Senha do usuário atualizada com sucesso",
      type: "object",
      properties: {
        message: { type: "string", example: "Senha do usuário atualizada com sucesso" },
        user: {
          type: "object",
          description: "Dados do usuário após a atualização da senha (sem o hash da senha).",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
          },
          // O campo 'required' deve ser um ARRAY
          required: ["id", "name", "email"],
        },
      },
    },
    400: {
      description: "Dados de entrada em formato inválido (ZodError para a senha).",
      type: "object",
      properties: {
        message: { type: "string", example: "Dados de entrada em formato inválido" },
        errors: { type: "array" }, // Detalhes do erro Zod (e.g., senha muito curta)
      },
    },
    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: {
        message: { type: "string", example: "Unauthorized" },
      },
    },
    // 404 pode ser retornado via AppError se o usuário não for encontrado
    404: {
      description: "Usuário não encontrado (AppError com 404)",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário não encontrado." },
        code: { type: "number", example: 404 },
      },
    },
    500: {
      description: "Erro interno do servidor",
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
  password: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
});
const userIdSchema = z.uuid();

export async function updateUserPasswordRoute(app: FastifyInstance) {
  app.patch(
    "/update_password",
    { preHandler: [app.authenticate], schema: updatePasswordSchema },
    async (request: any, reply) => {
      try {
        const { password } = bodySchema.parse(request.body);
        const userId = userIdSchema.parse((request.user as any).id);
        const result = await updateUserPasswordFunction({ userId, password });

        return reply.status(200).send({
          message: "Senha do usuário atualizada com sucesso",
          user: result,
        });
      } catch (error) {
        if (error instanceof AppError) {
          type AppErrorStatusCode = 404 | 200 | 400 | 401 | 500;
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
