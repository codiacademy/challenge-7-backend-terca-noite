import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { readUserProfileFunction } from "../../functions/users/read-user-profile-function";
import { AppError } from "../../utils/app-error";

const userIdSchema = z.uuid();

const readUserProfileSchema = {
  // 🏷️ METADADOS
  tags: ["Usuários"], // Tag específica para rotas da pasta users
  summary: "Obtém o perfil do usuário autenticado",
  description:
    "Retorna o nome, email e outros dados do perfil do usuário com base no JWT de autenticação.",

  security: [{ bearerAuth: [] }],

  response: {
    // ✅ 200 OK - Sucesso
    200: {
      description: "Perfil do usuário obtido com sucesso.",
      type: "object",
      properties: {
        message: { type: "string", example: "Perfil do usuário obtido com sucesso" },
        user: {
          type: "object",
          description: "Estrutura simplificada do perfil do usuário.",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            telephone: { type: "string" },
            two_factor_enabled: { type: "boolean" },
            notification_email_enabled: { type: "boolean" },
            notification_discord_enabled: { type: "boolean" },
            // Adicione aqui outros campos que readUserProfileFunction retorna
          },
        },
      },
    },

    // 🚨 ERROS DE CLIENTE (AppError e ZodError)

    // 400 Bad Request (ZodError - Erro de validação no ID do token, embora raro)
    400: {
      description: "Erro de validação, formato de ID inválido no token.",
      type: "object",
      properties: {
        message: { type: "string", example: "ID em formato inválido" },
        errors: { type: "array" },
      },
    },

    // 401 Unauthorized (Se o app.authenticate falhar)
    401: {
      description: "Não autorizado: Token inválido ou ausente.",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    },

    // 404 Not Found (Exemplo de AppError se o usuário não for encontrado)
    404: {
      description: "Recurso não encontrado (ex: Usuário não existe).",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário não encontrado." },
        code: { type: "number", example: 404 },
      },
    },

    // 500 Internal Server Error (Erro de Servidor)
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

export async function readUserProfileRoute(app: FastifyInstance) {
  app.get(
    "/read_profile",
    { schema: readUserProfileSchema, preHandler: [app.authenticate] },
    async (request: any, reply) => {
      try {
        console.log("Payload do usuário:", request.user);
        const userId = userIdSchema.parse((request.user as any).id);
        const userProfile = await readUserProfileFunction(userId);
        return reply.status(200).send({
          message: "Perfil do usuário obtido com sucesso",
          user: userProfile,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar deletar usuário no DB");
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
