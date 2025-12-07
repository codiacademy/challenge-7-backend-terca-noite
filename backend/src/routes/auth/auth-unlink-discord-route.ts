import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { deleteDiscordUserInfosFunction } from "../../functions/users/delete-discord-user-infos-function";

// --- 1. ESQUEMA DE RESPOSTA DE SUCESSO (200) ---
const unlinkDiscordSuccessResponseDoc = {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true,
      description: "Indica o sucesso da operação.",
    },
    message: {
      type: "string",
      example: "Discord desvinculado com sucesso",
      description: "Mensagem de confirmação.",
    },
    user: {
      type: "object",
      description: "Dados do usuário após a desvinculação (campos Discord devem ser nulos/vazios).",
      properties: {
        id: { type: "string", format: "uuid" },
        name: { type: "string" },
        email: { type: "string", format: "email" }, // Discord fields should be nullable/absent
        discordId: { type: "string", nullable: true },
        discordName: { type: "string", nullable: true },
      },
      required: ["id", "name", "email", "discordId", "discordName"],
    },
  },
  required: ["success", "message", "user"],
};

// --- 2. ESQUEMAS DE ERRO (Padrão AppError) ---
const appErrorResponseDoc = {
  type: "object",
  properties: {
    message: { type: "string", example: "Erro ao desvincular Discord" },
    code: { type: "number", example: 500 },
  },
};

const authUnlinkDiscordRouteSchema = {
  tags: ["Autenticação"],
  summary: "Desvincula o usuário autenticado de sua conta Discord.",
  description:
    "Remove as informações de vínculo do Discord (ID e Username) do perfil do usuário autenticado no banco de dados.",
  operationId: "authUnlinkDiscord", // Requer autenticação JWT no header

  security: [{ bearerAuth: [] }], // Não há corpo, parâmetros ou query strings necessários. O ID é obtido do token.

  response: {
    // ✅ 200 OK
    200: {
      description: "Discord desvinculado com sucesso.",
      ...unlinkDiscordSuccessResponseDoc,
    }, // ❌ 401 Unauthorized

    401: {
      description: "Não autorizado (Token JWT ausente ou inválido).",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    }, // ❌ 500 Internal Server Error

    500: {
      description: "Erro interno do servidor ao tentar desvincular o Discord.",
      ...appErrorResponseDoc,
    },
  },
};

export async function authUnlinkDiscordRoute(app: FastifyInstance) {
  app.post(
    "/discord/unlink",
    { preHandler: [app.authenticate], schema: authUnlinkDiscordRouteSchema },
    async (request, reply) => {
      const { id: userId } = request.user as any;

      try {
        const updatedUser = await deleteDiscordUserInfosFunction(userId);

        const cleanUser = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email, // Estes campos devem vir como null/undefined após a desvinculação
          discordId: updatedUser.discordId, // Renomeia discordName (Prisma) para username (Schema da API)
          discordName: updatedUser.discordName, // Campos sensíveis ou irrelevantes (password_hash, datas, etc.) são omitidos.
        };
        // Você pode retornar algo para o front como confirmação
        return reply.status(200).send({
          success: true,
          message: "Discord desvinculado com sucesso",
          user: cleanUser,
        });
      } catch (err: any) {
        app.log.error("Erro ao desvincular Discord", err);
        throw new AppError("Erro ao desvincular Discord", 500);
      }
    },
  );
}
