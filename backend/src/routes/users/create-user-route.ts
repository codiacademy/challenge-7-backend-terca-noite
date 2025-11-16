import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { createUserFunction } from "../../functions/users/create-user-function.ts";
import { AppError } from "../../utils/app-error.ts";

const bodySchema = z.object({
  fullName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.email("O email deve ser válido"),
  telephone: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Número de telefone inválido")
    .optional(),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export async function createUserRoute(app: FastifyInstance) {
  app.post("/create_user", async (request, reply) => {
    try {
      const { fullName, email, telephone, password } = bodySchema.parse(request.body);

      const result = await createUserFunction({
        fullName,
        email,
        telephone,
        password,
      });

      return reply.status(201).send({
        message: "Usuário criado com sucesso",
        user: result,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar criar usuário no DB");
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
