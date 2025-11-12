import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error.ts";
import { authLoginFunction } from "../../functions/auth/auth-login-function.ts";
import { z } from "zod";
import { twoFactorSendFunction } from "../../functions/auth/two-factor-send-function.ts";
import { generateTwoFactorTempToken } from "../../utils/tokens-service.ts";
import type { Payload } from "../../types/auth/refresh-token-types.ts";

export async function resendTwoFactor(app: FastifyInstance) {
  app.post("/resend_two_factor", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new AppError("Auth Header ausente", 401);
      const tempToken = authHeader.split(" ")[1];

      if (!tempToken) throw new AppError("Token ausente", 401);
      // Decodificar o token temporário
      const decoded = await app.jwt.verify<Payload>(tempToken);

      if (decoded.type != "2fa_pending") {
        throw new AppError("Token inválido para 2FA", 401);
      }

      await twoFactorSendFunction(decoded.id);

      const newTempToken = await generateTwoFactorTempToken(
        app,
        decoded.id,
        decoded.email,
        decoded.name,
      );
      return reply.status(200).send({
        message: " Código de verificação enviado para o e-mail.",
        tempToken: newTempToken,
      });
    } catch (error: any) {
      if (error.code === "FAST_JWT_EXPIRED") {
        return reply.status(401).send({
          message: "Seu código expirou. Faça login novamente.",
          code: "TEMP_TOKEN_EXPIRED",
        });
      }
      app.log.error(error, "Erro ao tentar reenviar código ao usuário");
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
      return reply.status(500).send({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  });
}
