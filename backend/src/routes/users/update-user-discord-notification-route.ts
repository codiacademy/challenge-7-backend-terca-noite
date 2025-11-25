import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error.ts";
import { updateUserDiscordNotificationFunction } from "../../functions/users/update-user-discord-notification-function.ts";
import { sendDiscordNotificationToUserFunction } from "../../functions/notifications/send-discord-notification-to-user-function.ts";
const idSchema = z.uuid();
export async function updateUserDiscordNotificationRoute(app: FastifyInstance) {
  app.patch(
    "/update_discord_notification",
    { preHandler: [app.authenticate] },
    async (request: any, reply) => {
      try {
        const userId = idSchema.parse((request.user as any).id);
        const updatedUser = await updateUserDiscordNotificationFunction({ userId });
        sendDiscordNotificationToUserFunction(userId);
        return reply.status(200).send({
          message: "Notificações por discord atualizadas com sucesso",
          user: updatedUser,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar a notificação por discord do usuário");
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({
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
