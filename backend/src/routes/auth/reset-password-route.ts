import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { verify2faCodeFunction } from "../../functions/auth/verify-2fa-code-function";
import { updateUserPasswordFunction } from "../../functions/users/update-user-password-function";

import type { Payload } from "../../types/auth/refresh-token-types.ts";

const bodySchema = z.object({
  code: z.string().min(6).max(6, "O código deve ter 6 dígitos"),
  password: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
});

export async function resetPasswordRoute(app: FastifyInstance) {
  app.post("/reset_password", async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new AppError("Auth Header ausente", 401);
      const tempToken = authHeader.split(" ")[1];

      if (!tempToken) throw new AppError("Token ausente", 401);

      const decoded = await app.jwt.verify<Payload>(tempToken);

      if (decoded.type != "2fa_pending") {
        throw new AppError("Token inválido para 2FA", 401);
      }

      const { code, password } = bodySchema.parse(request.body);
      console.log("Codigo e nova senha pegas");

      const isRightCode = await verify2faCodeFunction({ userId: decoded.id, code });
      console.log("Codigo verificado: " + isRightCode);
      if (isRightCode) {
        const changedUser = await updateUserPasswordFunction({ userId: decoded.id, password });
        reply.header("Content-Type", "application/json");
        return reply.type("application/json").status(200).send({
          message: "Senha alterada com sucesso! Faça login a seguir!",
          changedUser,
        });
      } else {
        return reply.status(401).send({
          message: "Código incorreto!",
        });
      }
    } catch (error: any) {
      if (error.code === "FAST_JWT_EXPIRED") {
        return reply.status(401).send({
          message: "Seu código expirou. Faça login novamente.",
          code: "TEMP_TOKEN_EXPIRED",
        });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Dados de entrada em formato inválido",
          errors: error.issues, // Retorna erros por campo
        });
      }
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
    }
  });
}
