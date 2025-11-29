import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.ts";
import { compareOtp } from "../../utils/otp-service.ts";
import { AppError } from "../../utils/app-error.ts";
import { z } from "zod";
import { authRefreshFunction } from "../../functions/auth/auth-refresh-function.ts";
import bcrypt from "bcrypt";
import type { Payload } from "../../types/auth/refresh-token-types.ts";
import { verify2faCodeFunction } from "../../functions/auth/verify-2fa-code-function.ts";
import { generateTokens } from "../../utils/tokens-service.ts";

const userIdSchema = z.uuid();

const bodySchema = z.object({
  code: z.string().min(6).max(6, "O código deve ter 6 dígitos"),
});
export async function twoFactorVerifyRoute(app: FastifyInstance) {
  app.post("/verify", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) throw new AppError("Auth Header ausente", 401);
      const tempToken = authHeader.split(" ")[1];
      if (!tempToken) throw new AppError("Token ausente", 401);
      const decoded = await app.jwt.verify<Payload>(tempToken);

      if (decoded.type != "2fa_pending") {
        throw new AppError("Token inválido para 2FA", 401);
      }

      const { code } = bodySchema.parse(request.body as { code: string });

      const isRightCode = await verify2faCodeFunction({ userId: decoded.id, code });

      if (isRightCode) {
        const tokens = await generateTokens(app, {
          userId: decoded.id,
          email: decoded.email,
          name: decoded.name ?? "",
        });

        reply.setCookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        return reply.status(200).send({
          message: "Autenticação 2FA concluída com sucesso",
          accessToken: tokens.accessToken,
        });
      } else {
        return reply.status(401).send({
          message: "Código incorreto!",
        });
      }

      // Gera access/refresh tokens completos
    } catch (error: any) {
      app.log.error(error, "Erro ao tentar verificar código 2FA");

      if (error.code === "FAST_JWT_EXPIRED") {
        return reply.status(401).send({
          message: "Seu código está expirado",
          code: 401,
        });
      }

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
        message: "Erro interno no servidor",
        code: 500,
      });
    }
  });
}
