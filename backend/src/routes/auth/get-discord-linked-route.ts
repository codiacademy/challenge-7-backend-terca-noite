import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { isDiscordLinkedFunction } from "../../functions/users/is-discord-linked-function";

// --- 1. ESQUEMA DE RESPOSTA DE SUCESSO (200) ---
const getDiscordLinkedSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Informação de link com DiscordObtida",
      description: "Mensagem de status.",
    },
    isDiscordLinked: {
      type: "boolean",
      example: true,
      description: "Status booleano indicando se o usuário está vinculado a uma conta Discord.",
    },
  },
  required: ["message", "isDiscordLinked"],
};

// --- 2. ESQUEMAS DE ERRO (Padrão AppError) ---
const appErrorResponseDoc = {
  type: "object",
  properties: {
    message: { type: "string", example: "Erro ao pegar informação de link com Discord" },
    code: { type: "number", example: 500 },
  },
};

const getDiscordLinkedRouteSchema = {
  tags: ["Autenticação"],
  summary: "Verifica se o usuário autenticado possui uma conta Discord vinculada.",
  description:
    "Retorna um status booleano indicando se o usuário atualmente autenticado está vinculado a uma conta Discord.",
  operationId: "getDiscordLinkedStatus", // Requer autenticação JWT no header

  security: [{ bearerAuth: [] }], // Não há corpo, parâmetros ou query strings necessários.

  response: {
    // ✅ 200 OK
    200: {
      description: "Status de vínculo do Discord retornado com sucesso.",
      ...getDiscordLinkedSuccessResponseDoc,
    }, // ❌ 401 Unauthorized

    401: {
      description: "Não autorizado (Token JWT ausente ou inválido).",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    }, // ❌ 500 Internal Server Error

    500: {
      description: "Erro interno do servidor ao consultar o status do Discord.",
      ...appErrorResponseDoc,
    },
  },
};

export async function getDiscordLinkedRoute(app: FastifyInstance) {
  app.get(
    "/get_discord_linked",
    { preHandler: [app.authenticate], schema: getDiscordLinkedRouteSchema },
    async (request, reply) => {
      try {
        const { id: userId } = request.user as any;
        const isDiscordLinked = await isDiscordLinkedFunction(userId);
        return reply
          .status(200)
          .send({ message: "Informação de link com DiscordObtida", isDiscordLinked });
      } catch (error: any) {
        app.log.error("Erro ao pegar informação de link com Discord", error);
        throw new AppError("Erro ao pegar informação de link com Discord", 500);
      }
    },
  );
}
