import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma.ts";
import { compareOtp } from "../../utils/otp-service.ts";
import { AppError } from "../../utils/app-error.ts";
import { z } from "zod";
import { authRefreshFunction } from "../../functions/auth/auth-refresh-function.ts";
import bcrypt from "bcrypt";
import type { Payload } from "../../types/auth/refresh-token-types.ts";

const userIdSchema = z.uuid();

export async function twoFactorVerifyRoute(app: FastifyInstance) {
  app.post("/verify", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new AppError("Token ausente", 401);
      const tempToken = authHeader.split(" ")[1];

      if (!tempToken) throw new AppError("Token ausente", 401);
      // Decodificar o token temporário
      const decoded = await app.jwt.verify<Payload>(tempToken);

      if (decoded.type != "2fa_pending") {
        throw new AppError("Token inválido para 2FA", 401);
      }

      const { code } = request.body as { code: string };
      const record = await prisma.twoFactorRequest.findFirst({
        where: { userId: decoded.id },
        orderBy: { createdAt: "desc" },
      });

      if (!record) throw new AppError("Código não encontrado", 400);
      if (record.expiresAt < new Date()) throw new AppError("Código expirado", 400);

      const match = await bcrypt.compare(code, record.codeHash);
      if (!match) throw new AppError("Código incorreto", 400);

      // Gera access/refresh tokens completos
      const tokens = await authRefreshFunction(app, {
        userId: decoded.id,
        decodedToken: decoded,
        refreshToken: tempToken, // você pode adaptar
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
    } catch (error) {
      app.log.error(error, "Erro ao tentar verificar código 2FA");
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
    }
  });
}
