import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { updateUserDiscordNotificationFunction } from "../../functions/users/update-user-discord-notification-function";
import { sendDiscordNotificationToUserFunction } from "../../functions/notifications/send-discord-notification-to-user-function";
import { updateDiscordUserInfos } from "../../functions/users/update-discord-user-infos-function";
const idSchema = z.uuid();
const updateDiscordNotificationSchema = {
  $id: "updateDiscordNotificationSchema", // Adicionado para sanidade
  summary: "Alterna (liga/desliga) o status de notificação Discord do usuário autenticado.",
  description:
    "Esta rota é usada para mudar o status de permissão de notificação via Discord com um toggle para o usuário atualmente autenticado. Após a atualização, uma notificação de teste é enviada.",
  tags: ["Usuários"],

  security: [{ bearerAuth: [] }],

  response: {
    200: {
      description: "Notificações por discord atualizadas com sucesso",
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Notificações por discord atualizadas com sucesso",
        },
        user: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid", description: "ID único do usuário" },
            name: { type: "string", description: "Nome completo do usuário" },
            email: { type: "string", format: "email", description: "Email do usuário" },
            discordNotificationEnabled: {
              type: "boolean",
              description: "Status de notificação Discord",
            },
          },
          required: ["id", "name", "email", "discordNotificationEnabled"],
        },
      },
    },
    400: {
      description: "ID em formato inválido no token (ZodError) ou dados de entrada inválidos.",
      type: "object",
      properties: {
        message: { type: "string", example: "ID em formato inválido" },
        errors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "array", items: { type: "string" } },
              message: { type: "string" },
            },
          },
        },
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

export async function updateUserDiscordNotificationRoute(app: FastifyInstance) {
  app.patch(
    "/update_discord_notification",
    { preHandler: [app.authenticate], schema: updateDiscordNotificationSchema },
    async (request: any, reply) => {
      try {
        const userId = idSchema.parse((request.user as any).id);
        const updatedUser = await updateUserDiscordNotificationFunction({ userId });
        sendDiscordNotificationToUserFunction(userId);
        const cleanUser = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          // 💡 Mapeamento e Renomeação obrigatória:
          discordNotificationEnabled: updatedUser.notification_discord_enabled,
          // Excluindo password_hash, created_at, e todos os outros campos
        };
        return reply.status(200).send({
          message: "Notificações por discord atualizadas com sucesso",
          user: cleanUser,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar a notificação por discord do usuário");
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
