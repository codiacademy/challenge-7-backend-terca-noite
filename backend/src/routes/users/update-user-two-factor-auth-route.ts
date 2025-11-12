import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error.ts";
import { updateUserTwoFactorAuthFunction } from "../../functions/users/update-user-two-factor-auth-function.ts";
import { z } from "zod";

const userIdSchema = z.string().uuid();

export async function updateUserTwoFactorAuthRoute(app: FastifyInstance) {
  app.patch(
    "/update_two_factor_auth",
    { preHandler: [app.authenticate] },
    async (request: any, reply) => {
      try {
        const userId = userIdSchema.parse((request.user as any).id);
        const updatedUser = await updateUserTwoFactorAuthFunction(userId);
        return reply.status(200).send({
          message: "Verificação por duas etapas atualizada com sucesso",
          user: updatedUser,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar a verificação por duas etapas do usuário");
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
