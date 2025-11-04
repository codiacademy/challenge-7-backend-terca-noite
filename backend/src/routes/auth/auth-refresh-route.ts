import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env.ts";
import { generateTokens } from "../../utils/generate-tokens.ts";
import { AppError } from "../../utils/app-error.ts";
import z, { any } from "zod";
export async function authRefreshRoute(app: FastifyInstance) {
  app.post("/refresh", { preHandler: app.authenticate }, async (request, reply) => {
    try {
      const refreshToken = request.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AppError("Refresh token ausente", 401);
      }
      const decoded = await request.jwtVerify<{
        userId: string;
        email: string;
        name: string;
        type: "access" | "refresh";
      }>();
      if (decoded.type !== "refresh") {
        throw new AppError("Token de refresh inválido", 401);
      }

      const tokens = await generateTokens(app, {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
      });

      reply.setCookie("refreshToken", tokens.refreshToken, {
        path: "/",
        secure: true,
        sameSite: "strict",
        httpOnly: true,
      });

      // Retorna o novo access token
      return reply.status(200).send({
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

      return reply.status(500).send({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  });
}
