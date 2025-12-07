import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { updateUserEmailNotificationFunction } from "../../functions/users/update-user-email-notification-function";
import { sendOverviewEmailtoUser } from "../../functions/notifications/send-overview-email-to-user-function";

const userResponseSchemaDoc = {
  type: "object",
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID único do usuário",
    },
    name: {
      type: "string",
      description: "Nome do usuário",
    },
    email: {
      type: "string",
      format: "email",
      description: "Email do usuário",
    },
    emailNotificationEnabled: {
      type: "boolean",
      description: "Status de notificação por e-mail",
    },
  },
  // 🔑 Aqui está a correção crucial: 'required' deve ser um ARRAY
  required: ["id", "name", "email", "emailNotificationEnabled"],
};

// Documentação Swagger (OpenAPI) para a rota PATCH
const updateEmailNotificationSchema = {
  summary: "Alterna (liga/desliga) o status de notificação por e-mail do usuário autenticado.",
  description:
    "Esta rota é usada para mudar o status de permissão de notificação via e-mail com um toggle para o usuário atualmente autenticado. Após a atualização, um e-mail de teste ou visão geral pode ser enviado.",
  tags: ["Usuários"],

  // Esquema de segurança (Fastify/OpenAPI)
  security: [{ bearerAuth: [] }],

  // Não há 'body' nem 'params'

  response: {
    200: {
      description: "Notificações por email atualizadas com sucesso",
      type: "object",
      properties: {
        message: { type: "string", example: "Notificações por email atualizadas com sucesso" },
        user: userResponseSchemaDoc, // Retorna os dados do usuário atualizado
      },
    },
    400: {
      description: "ID em formato inválido no token (ZodError) ou dados de entrada inválidos.",
      type: "object",
      properties: {
        message: { type: "string", example: "ID em formato inválido" },
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
      description: "Usuário não encontrado (AppError com 404)",
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

const idSchema = z.uuid();
export async function updateUserEmailNotificationRoute(app: FastifyInstance) {
  app.patch(
    "/update_email_notification",
    { preHandler: [app.authenticate], schema: updateEmailNotificationSchema },
    async (request: any, reply) => {
      try {
        const userId = idSchema.parse((request.user as any).id);
        const updatedUser = await updateUserEmailNotificationFunction({ userId });
        await sendOverviewEmailtoUser(userId);

        const cleanUser = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email, // Renomeia notification_email_enabled (Prisma) para emailNotificationEnabled (Schema da API)
          emailNotificationEnabled: updatedUser.notification_email_enabled, // Outros campos sensíveis ou desnecessários (password_hash, created_at, updated_at) são omitidos por default.
        };
        return reply.status(200).send({
          message: "Notificações por email atualizadas com sucesso",
          user: cleanUser,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar a notificação por email do usuário");
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
            message: "ID em formato inválido",
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
