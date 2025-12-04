import z from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { isPasswordCorrectFunction } from "../../functions/auth/is-password-correct-function";

const bodySchema = z.object({
  userId: z.uuid(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export async function verifyPasswordRoute(app: FastifyInstance) {
  app.post("/verify_password", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { userId, password } = bodySchema.parse({
        password: (request.body as any)?.password,
        userId: (request.user as any)?.id,
      });
      const isCorrect = await isPasswordCorrectFunction({ userId, password });
      return reply.status(200).send({
        message: "Verificação de senha realizada com sucesso",
        isPasswordCorrect: isCorrect,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar verificar senha no DB");
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "ID em formato inválidos",
          errors: error.issues, // Retorna erros por campo
        });
      }

      return reply.status(500).send({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  });
}
