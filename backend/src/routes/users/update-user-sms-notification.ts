import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error.ts";
import { updateUserSmsNotificationFunction } from "../../functions/users/update-user-sms-notification-function.ts";

const idSchema = z.uuid();
export async function updateUserSmsNotificationRoute(app: FastifyInstance) {
  app.put(
    "/update_sms_notification",
    { preHandler: [app.authenticate] },
    async (request: any, reply) => {
      try {
        const userId = idSchema.parse((request.user as any).id);
        const updatedUser = await updateUserSmsNotificationFunction({ userId });
        return reply.status(200).send({
          message: "Notificações por SMS atualizadas com sucesso",
          user: updatedUser,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar notificações por SMS do usuário no DB");
        if (error instanceof AppError) {
          reply.status(error.statusCode).send({ message: error.message });
        } else {
          reply.status(500).send({ message: "Erro interno do servidor" });
        }
      }
    }
  );
}