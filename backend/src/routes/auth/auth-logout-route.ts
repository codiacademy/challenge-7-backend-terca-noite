import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { authLogoutFunction } from "../../functions/auth/auth-logout-function";

import { z } from "zod";

const userIdSchema = z.uuid();

export async function authLogoutRoute(app: FastifyInstance) {
  app.post("/logout", { preHandler: app.verifyRefreshToken }, async (request, reply) => {
    try {
      const logoutUserId = userIdSchema.parse((request.user as any).id);
      const refreshToken = await request.cookies?.refreshToken;
      console.log("Refresh Token no logout:", refreshToken);
      if (!refreshToken) {
        throw new AppError(" O refreshToken não foi encontrado", 401);
      }

      const userExits = await authLogoutFunction(app, refreshToken, logoutUserId);
      reply.clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
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
  });
}
