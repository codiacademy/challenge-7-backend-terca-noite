import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { updateUserProfileFunction } from "../../functions/users/update-user-profile-function";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const bodySchemaDoc = {
  type: "object",
  description: "Campos opcionais para atualização. Pelo menos um campo deve ser fornecido.",
  properties: {
    fullName: {
      type: "string",
      description: "Nome completo do usuário.",
      nullable: true,
    },
    email: {
      type: "string",
      description: "Novo endereço de email.",
      nullable: true,
    },
    telephone: {
      type: "string",
      description: "Novo número de telefone (formato E.164 sugerido, ex: +5511987654321).",
      nullable: true,
    },
  },
};

// Esquema de Resposta de Sucesso para um Usuário Atualizado
const userResponseSchemaDoc = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID único do usuário",
    },
    fullName: {
      type: "string",
      description: "Nome completo atualizado",
    },
    email: {
      type: "string",
      format: "email",
      description: "Email atualizado",
    },
    telephone: {
      type: "string",
      nullable: true,
      description: "Telefone atualizado (ou null)",
    },
  },
  // 💡 O campo 'required' é crucial e deve ser um ARRAY!
  required: ["id", "fullName", "email"], // Assumindo que ID, Nome e Email são sempre retornados
};
// Documentação Swagger (OpenAPI) para a rota PATCH
const updateProfileSchema = {
  summary: "Atualiza o perfil do usuário atualmente autenticado.",
  description:
    "Esta rota permite a atualização parcial do perfil (nome, email, telefone). Todos os campos são opcionais.",
  tags: ["Usuários"],

  // Esquema de segurança (Fastify/OpenAPI)
  security: [{ bearerAuth: [] }],

  // Definição do corpo da requisição
  body: bodySchemaDoc,

  response: {
    200: {
      description: "Perfil do usuário atualizado com sucesso",
      type: "object",
      properties: {
        message: { type: "string", example: "Perfil do usuário atualizado com sucesso" },
        user: userResponseSchemaDoc, // Retorna os dados do usuário atualizado
      },
    },
    400: {
      description: "Dados de entrada em formato inválido (ZodError).",
      type: "object",
      properties: {
        message: { type: "string", example: "Dados de entrada em formato inválido" },
        errors: { type: "array" }, // Detalhes do erro Zod
      },
    },
    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: {
        message: { type: "string", example: "Unauthorized" },
      },
    },
    404: {
      description: "Usuário não encontrado ou recurso não encontrado (AppError com 404).",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário não encontrado." },
        code: { type: "number", example: 404 },
      },
    },
    500: {
      description: "Erro interno do servidor",
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Erro interno do servidor. Tente novamente mais tarde.",
        },
      },
    },
  },
};

const bodySchema = z.object({
  fullName: z.string().optional(),
  email: z.email().optional(),
  telephone: z
    .string()
    .regex(/^\+?\d{10,15}$/, "Número de telefone inválido")
    .optional(),
});

const userIdSchema = z.uuid();

export async function updateUserProfileRoute(app: FastifyInstance) {
  app.patch(
    "/update_profile",
    { preHandler: [app.authenticate], schema: updateProfileSchema },
    async (request: any, reply) => {
      try {
        const rawBody = request.body;
        const body = Object.fromEntries(
          Object.entries(rawBody).filter(([_, value]) => value !== ""),
        );
        const { fullName, email, telephone } = bodySchema.parse(body);
        const userId = userIdSchema.parse((request.user as any).id);
        const result = await updateUserProfileFunction({ userId, fullName, email, telephone });

        const cleanUser = {
          id: userId, // Mapeamento do campo 'name' (Prisma) para 'fullName' (Schema da API)
          fullName: result.name,
          email: result.email, // O campo 'telephone' pode ser null no Prisma.
          telephone: result.telephone, // Campos como password_hash, created_at, updated_at, discordId, etc.,
          // são omitidos por default, pois não foram explicitamente incluídos aqui.
        };
        return reply.status(200).send({
          message: "Perfil do usuário atualizado com sucesso",
          user: cleanUser,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar usuário no DB");
        if (error instanceof AppError) {
          type AppErrorStatusCode = 404 | 200 | 400 | 401 | 500;
          const statusCode = error.statusCode as AppErrorStatusCode;
          return reply.status(statusCode).send({
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
    },
  );
}
