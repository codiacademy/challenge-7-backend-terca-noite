import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error.ts";
import { updateUserProfileFunction } from "../../functions/users/update-user-profile-function.ts";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().optional(),
  email: z.email().optional(),
  telephone: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Número de telefone inválido")
    .optional(),
});

const userIdSchema = z.uuid();

export async function updateUserProfileRoute(app: FastifyInstance) {
  app.put("/update_profile", { preHandler: [app.authenticate] }, async (request: any, reply) => {
    try {
      const { name, email, telephone } = bodySchema.parse(request.body);
      const userId = userIdSchema.parse((request.user as any).id);
      const result = await updateUserProfileFunction({ userId, name, email, telephone });

      return reply.status(200).send({
        message: "Perfil do usuário atualizado com sucesso",
        user: result,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar deletar usuário no DB");
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
