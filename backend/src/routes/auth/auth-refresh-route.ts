import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env.ts";
import { AppError } from "../../utils/app-error.ts";
import z, { any } from "zod";
import type { FastifyJWT } from "@fastify/jwt";
import { authRefreshFunction } from "../../functions/auth/auth-refresh-function.ts";
import type { RefreshPayload } from "../../types/auth/refresh-token-types.ts";

export async function authRefreshRoute(app: FastifyInstance) {
  app.post(
    "/refresh",
    { preHandler: (request, reply, done) => (app as any).verifyRefreshToken(request, reply, done) },
    async (request, reply) => {
      try {
        const refreshToken = await request.cookies?.refreshToken;
        if (!refreshToken) {
          throw new AppError("Refresh token ausente", 401);
        }
        const decoded = await app.jwt.verify<RefreshPayload>(refreshToken);
        console.log("🔍 Decoded Refresh Token:", JSON.stringify(decoded, null, 2));
        if (decoded.type !== "refresh") {
          throw new AppError("Este token não é de refresh", 401);
        }

        const { userId } = decoded;
        const tokens = await authRefreshFunction({
          app,
          userId: decoded.userId,
          decodedToken: decoded,
          refreshToken,
        });
        return reply
          .setCookie("refreshToken", tokens.refreshToken, {
            path: "/",
            secure: true,
            sameSite: "strict",
            httpOnly: true,
          })
          .status(200)
          .send({
            message: "Refresh Token gerado com sucesso.",
            accessToken: tokens.accessToken,
          });
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
        console.error("Erro no /refresh:", error);
        return reply.status(500).send({
          message: "Erro interno do servidor. Tente novamente mais tarde.",
        });
      }
    },
  );
}
