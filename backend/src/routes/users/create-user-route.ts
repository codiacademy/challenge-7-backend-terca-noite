import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { createUserFunction } from "../../functions/users/create-user-function.ts";
import { AppError } from "../../utils/app-error.ts";

const createUserSchema = {
  tags: ["Usuários"], // Grupo na documentação
  summary: "Cria um novo usuário", // Descrição breve
  description: "Cria um novo registro de usuário no sistema.",

  body: {
    type: "object",
    required: ["fullName", "email", "password"],
    properties: {
      fullName: {
        type: "string",
        description: "Nome completo do usuário. Deve ter pelo menos 3 caracteres.",
      },
      email: {
        type: "string",
        format: "email",
        description: "Email válido para acesso.",
      },
      telephone: {
        type: "string",
        description: "Número de telefone opcional (ex: +5511987654321).",
        pattern: "^\\+?\\d{10,15}$",
      },
      password: {
        type: "string",
        description: "Senha de acesso. Deve ter pelo menos 8 caracteres.",
      },
    },
  },

  response: {
    201: {
      description: "Usuário criado com sucesso",
      type: "object",
      properties: {
        message: { type: "string" },
        user: {
          type: "object",
          properties: {
            id: { type: "string", description: "ID único do usuário" },
            name: { type: "string" },
            email: { type: "string" },
            telephone: { type: "string" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "email", "created_at", "updated_at", "telephone"],
        },
      },
    },

    400: {
      description: "Dados de entrada em formato inválido",
      type: "object",
      properties: {
        message: { type: "string" },
        errors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "array", items: { type: "string" } },
              message: { type: "string" },
            },
          },
        },
      },
    },
    401: {
      description: "Não Autorizado",
      type: "object",
      properties: { message: { type: "string" }, code: { type: "number" } },
    },
    404: {
      description: "Recurso não encontrado",
      type: "object",
      properties: { message: { type: "string" }, code: { type: "number" } },
    },
    409: {
      description: "Conflito (e.g., email já cadastrado)",
      type: "object",
      properties: {
        message: { type: "string" },
        code: { type: "number" },
      },
    },

    500: {
      description: "Erro interno do servidor",
      type: "object",
      properties: {
        message: { type: "string" },
      },
    },
  },
};

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
  app.post("/create_user", { schema: createUserSchema }, async (request, reply) => {
    try {
      const { fullName, email, telephone, password } = bodySchema.parse(request.body);
      console.log("Rota de Criação de Usuário!");
      const result = await createUserFunction({
        fullName,
        email,
        telephone,
        password,
      });

      console.log("Usuário criado e retornado!");
      return reply.status(201).send({
        message: "Usuário criado com sucesso",
        user: result,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar criar usuário no DB");
      if (error instanceof AppError) {
        type AppErrorStatusCode = 201 | 400 | 401 | 404 | 409 | 500;

        const statusCode = error.statusCode as AppErrorStatusCode;
        return reply.status(statusCode).send({
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
