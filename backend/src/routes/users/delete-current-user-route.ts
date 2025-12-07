import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { deleteUserFunction } from "../../functions/users/delete-user-function";

const deleteUserSchema = {
  // 🏷️ METADADOS
  tags: ["Usuários"],
  summary: "Deleta o perfil do usuário autenticado",
  description:
    "Remove o registro do usuário atual (logado) e todos os seus dados associados, com base no ID extraído do Token JWT.",

  // 🔒 SEGURANÇA
  security: [{ bearerAuth: [] }], // Indica que a rota requer um token JWT

  // ➡️ INPUTS
  // Esta rota não requer body, params ou querystring, pois o ID vem do JWT.

  // ⬅️ OUTPUTS (RESPOSTAS)
  response: {
    // ✅ 200 OK - Sucesso
    200: {
      description: "Usuário deletado com sucesso.",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário deletado com sucesso" },
        // Depende do que deleteUserFunction retorna (se for o usuário deletado, use a estrutura).
        user: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            // Adicione outros campos relevantes retornados após a deleção, se houver.
          },
          example: { id: "a1b2c3d4-e5f6-7890-1234-567890abcdef" },
        },
      },
    },

    // 🚨 ERROS DE CLIENTE (AppError e ZodError)

    // 400 Bad Request (ZodError - Erro de validação se o ID no token for inválido)
    400: {
      description: "Erro de validação, formato de ID inválido no token.",
      type: "object",
      properties: {
        message: { type: "string", example: "ID em formato inválidos" },
        errors: { type: "array" },
      },
    },

    // 401 Unauthorized (Se o app.authenticate falhar ou o token for inválido)
    401: {
      description: "Não autorizado: Token inválido ou ausente.",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    },

    // 404 Not Found (Exemplo de AppError se o usuário não for encontrado antes da deleção)
    404: {
      description: "Usuário não encontrado.",
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
const userIdSchema = z.uuid();

export async function deleteUserRoute(app: FastifyInstance) {
  app.delete(
    "/delete_current_user",
    { preHandler: [app.authenticate], schema: deleteUserSchema },
    async (request, reply) => {
      try {
        const userId = userIdSchema.parse((request.user as any).id);
        const result = await deleteUserFunction(userId);
        const cleanUser = {
          id: result.id,
        };
        return reply.status(200).send({
          message: "Usuário deletado com sucesso",
          user: cleanUser,
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
