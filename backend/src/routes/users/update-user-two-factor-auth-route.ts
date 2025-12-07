import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { updateUserTwoFactorAuthFunction } from "../../functions/users/update-user-two-factor-auth-function";
import { z } from "zod";
const userResponseSchemaDoc = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID único do usuário",
    },
    fullName: {
      type: "string",
      description: "Nome completo do usuário",
    },
    email: {
      type: "string",
      format: "email",
      description: "Email do usuário",
    },
    twoFactorAuthEnabled: {
      type: "boolean",
      description: "Status da autenticação de dois fatores (true/false)",
    },
  }, // 🔑 'required' é um ARRAY de strings, garantindo validade JSON Schema
  required: ["id", "fullName", "email", "twoFactorAuthEnabled"],
};

// Documentação Swagger (OpenAPI) para a rota PATCH /update_two_factor_auth
const updateTwoFactorAuthSchema = {
  summary: "Alterna o status da autenticação de dois fatores (2FA) do usuário autenticado.",
  description:
    "Esta rota é usada para ativar ou desativar o recurso de verificação por duas etapas (2FA) do usuário que está logado. A ação (ativação/desativação) é determinada pela função de backend.",
  tags: ["Usuários"],

  // Esquema de segurança (Fastify/OpenAPI)
  security: [{ bearerAuth: [] }],

  // Não há 'body' na requisição

  response: {
    200: {
      description: "Status do 2FA do usuário atualizado com sucesso.",
      type: "object",
      properties: {
        message: { type: "string", example: "Verificação por duas etapas atualizada com sucesso" },
        user: userResponseSchemaDoc, // Retorna os dados do usuário atualizado
      },
    },
    400: {
      description: "ID em formato inválido (ZodError na extração do ID).",
      type: "object",
      properties: {
        message: { type: "string", example: "ID em formato inválido" },
        errors: { type: "array" }, // Detalhes do erro Zod
      },
    },
    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: {
        message: { type: "string", example: "Unauthorized" },
      },
    },
    404: {
      description: "Usuário não encontrado (AppError com 404).",
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
const userIdSchema = z.uuid();

export async function updateUserTwoFactorAuthRoute(app: FastifyInstance) {
  app.patch(
    "/update_two_factor_auth",
    { preHandler: [app.authenticate], schema: updateTwoFactorAuthSchema },
    async (request: any, reply) => {
      try {
        const userId = userIdSchema.parse((request.user as any).id);
        const updatedUser = await updateUserTwoFactorAuthFunction(userId);
        const cleanUser = {
          id: updatedUser.id, // Mapeamento de 'name' (Prisma) para 'fullName' (Schema da API)
          fullName: updatedUser.name,
          email: updatedUser.email, // Renomeia two_factor_enabled (Prisma) para twoFactorAuthEnabled (Schema da API)
          twoFactorAuthEnabled: updatedUser.two_factor_enabled, // Campos sensíveis ou irrelevantes (password_hash, datas, relacionamentos) são omitidos.
        };
        return reply.status(200).send({
          message: "Verificação por duas etapas atualizada com sucesso",
          user: cleanUser,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar a verificação por duas etapas do usuário");
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
            message: "ID em formato inválido",
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
