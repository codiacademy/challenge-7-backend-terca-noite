import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "../../utils/app-error.ts";
import { updateUserPasswordFunction } from "../../functions/users/update-user-password-function.ts";
const bodySchema = z.object({
  newPassword: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
});
const userIdSchema = z.uuid();

export async function updateUserPasswordRoute(app: FastifyInstance) {
  app.patch("/update_password", { preHandler: [app.authenticate] }, async (request: any, reply) => {
    try {
      const { newPassword } = bodySchema.parse(request.body);
      const userId = userIdSchema.parse((request.user as any).id);
      const result = await updateUserPasswordFunction({ userId, newPassword });

      return reply.status(200).send({
        message: "Senha do usuário atualizada com sucesso",
        user: result,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar atualizar a senha do usuário");
      if (error instanceof AppError) {
      }
    }
  });
}
