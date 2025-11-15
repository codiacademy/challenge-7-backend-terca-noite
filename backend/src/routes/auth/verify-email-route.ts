import z from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error.ts";
import { isPasswordCorrectFunction } from "../../functions/auth/is-password-correct-function.ts";
import { verifyEmailFunction } from "../../functions/auth/verify-email-function.ts";
import { getIdFromEmailFunction } from "../../functions/users/get-id-from-email-function.ts";
import { getNameFromEmailFunction } from "../../functions/users/get-name-from-email-function.ts";

import { twoFactorSendFunction } from "../../functions/auth/two-factor-send-function.ts";
import { generateTwoFactorTempToken } from "../../utils/tokens-service.ts";

const emailSchema = z.object({
  email: z.email(),
});
export async function verifyEmailRoute(app: FastifyInstance) {
  app.post("/verify_email", async (request, reply) => {
    try {
      const body = emailSchema.parse(request.body);
      const emailExists = await verifyEmailFunction(body.email);
      if (emailExists) {
        const userId = await getIdFromEmailFunction(body.email);
        const name = await getNameFromEmailFunction(body.email);
        await twoFactorSendFunction(userId);
        const newTempToken = await generateTwoFactorTempToken(app, userId, body.email, name);
        return reply.status(200).send({
          message: " Código de verificação enviado para o e-mail.",
          tempToken: newTempToken,
        });
      }
    } catch (error) {
      app.log.error(error, "Erro ao tentar verificar email no DB");
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Email em formato inválido",
          errors: error.issues, // Retorna erros por campo
        });
      }

      return reply.status(500).send({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  });
}
