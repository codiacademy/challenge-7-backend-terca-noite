import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error.ts";
import { authLogoutFunction } from "../../functions/auth/auth-logout-function.ts";
import { z } from "zod";

const userIdSchema = z.uuid();

export async function authLogoutRoute(app: FastifyInstance) {
  app.post(
    "/logout",
    { preHandler: (request, reply) => (app as any).verifyRefreshToken(request, reply) },
    async (request, reply) => {
      try {
        const logoutUserId = userIdSchema.parse((request.user as any).id);
        const userExits = await authLogoutFunction(logoutUserId);
        reply.clearCookie("refreshToken", { path: "/", httpOnly: true, secure: true });
        return reply.status(200).send({ status: "Logout realizado com sucesso" });
      } catch (error) {
        app.log.error(error, "Erro ao tentar deslogar usuário");
        if (error instanceof AppError) {
          return reply.status(error.statusCode).send({
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
