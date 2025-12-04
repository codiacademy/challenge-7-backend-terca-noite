import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { updateUserEmailNotificationFunction } from "../../functions/users/update-user-email-notification-function";
import { sendOverviewEmailtoUser } from "../../functions/notifications/send-overview-email-to-user-function";
const idSchema = z.uuid();
export async function updateUserEmailNotificationRoute(app: FastifyInstance) {
  app.patch(
    "/update_email_notification",
    { preHandler: [app.authenticate] },
    async (request: any, reply) => {
      try {
        const userId = idSchema.parse((request.user as any).id);
        const updatedUser = await updateUserEmailNotificationFunction({ userId });
        await sendOverviewEmailtoUser(userId);
        return reply.status(200).send({
          message: "Notificações por email atualizadas com sucesso",
          user: updatedUser,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar a notificação por email do usuário");
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
