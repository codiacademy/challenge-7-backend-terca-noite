import type { FastifyInstance } from "fastify";

import { AppError } from "../../utils/app-error";
import { getDiscordUserFunction } from "../../functions/users/get-discord-user-function";
import { updateDiscordUserInfos } from "../../functions/users/update-discord-user-infos-function";
import { getUserIdFromAuthStateFunction } from "../../functions/auth/get-userId-from-auth-state-function";
import axios from "axios";
// --- 1. SCHEMAS DE PARÂMETROS DE CONSULTA (QUERY PARAMS) ---
// O Fastify/Swagger não exige o 'query' para redirecionamentos, mas o definimos para clareza
const discordCallbackQuerySchemaDoc = {
  type: "object",
  required: ["code", "state"],
  properties: {
    code: {
      type: "string",
      description:
        "Código de autorização OAuth2 enviado pelo Discord (presente em caso de sucesso).",
    },
    state: {
      type: "string",
      description: "Token de estado CSRF que contém o ID do usuário (presente em caso de sucesso).",
    },
    error: {
      type: "string",
      description:
        "Mensagem de erro enviada pelo Discord (presente em caso de falha de autorização).",
    },
  },
};

// --- 2. ESQUEMA DE ERRO INTERNO (500) ---
const errorResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Erro ao redirecionar para vincular discord",
    },
  },
};

// --- ESQUEMA COMPLETO DA ROTA (Swagger/OpenAPI) ---
const AuthCallbackDiscordRouteSchema = {
  tags: ["Autenticação"],
  summary: "Callback de Autorização do Discord (OAuth2).",
  description:
    "Endpoint chamado pelo Discord após o usuário autorizar o aplicativo. Este endpoint vincula a conta do Discord ao usuário e redireciona para a tela de configurações do cliente (Front-end).",
  operationId: "discordCallback", // Não há segurança direta nesta rota, pois ela lida com tokens OAuth2 (code/state)

  security: [], // Parâmetros de consulta (Query)

  querystring: discordCallbackQuerySchemaDoc,

  response: {
    // Em caso de sucesso ou cancelamento pelo usuário, esta rota REDIRECIONA (status 302/303),
    // mas a documentação deve refletir a ação.
    302: {
      description:
        "Redirecionamento para a tela de configurações do cliente (http://localhost:5173/settings) em caso de sucesso ou cancelamento.",
      type: "null", // O Fastify-Swagger pode aceitar 'null' ou um schema vazio para redirecionamentos.
    }, // O único erro que retorna um payload JSON é o AppError no bloco catch (500)
    500: {
      description: "Erro interno do servidor ao processar o callback do Discord.",
      ...errorResponseDoc,
    },
  },
};

export async function AuthCallbackDiscordRoute(app: FastifyInstance) {
  app.get(
    "/discord/callback",
    { schema: AuthCallbackDiscordRouteSchema },
    async (request, reply) => {
      // gera a URL de autorização

      const query = request.query as { code?: string; state?: string; error?: string };

      if (query.error) {
        app.log.warn(`Vínculo do Discord cancelado pelo usuário. Erro: ${query.error}`);

        // Se o usuário cancelou, redirecione-o de volta para a tela de settings (Front)
        return reply.status(302).redirect("http://localhost:5173/settings");
      }

      try {
        const fullState = query.state;
        if (!fullState) {
          throw new Error("Parâmetro 'state' ausente na requisição de callback.");
        }
        const state = fullState.substring(0, 36);
        if (!app.oauth2DiscordOAuth2)
          throw new AppError("Erro ao encontrar plugin de autenticação do discord");
        const { token } =
          await app.oauth2DiscordOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        const userId = await getUserIdFromAuthStateFunction(state);
        const discordUser = await getDiscordUserFunction(token.access_token);
        const updatedUser = await updateDiscordUserInfos({
          userId,
          discordId: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
        });

        const guildId = process.env.DISCORD_TARGET_GUILD_ID!;
        const botToken = process.env.DISCORD_BOT_TOKEN!;
        try {
          await axios.put(
            `https://discord.com/api/guilds/${guildId}/members/${discordUser.id}`,
            {
              access_token: token.access_token,
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bot ${botToken}`,
              },
            },
          );

          app.log.info(`Usuário ${discordUser.username} adicionado ao servidor do Discord.`);
        } catch (err: any) {
          console.error(
            "Erro ao adicionar usuário ao servidor Discord:",
            err.response?.data || err,
          );
          // Não impede o vínculo; apenas registra erro
        }
        reply.redirect("http://localhost:5173/settings");
      } catch (error: any) {
        console.log(error);
        throw new AppError("Erro ao redirecionar para vincular discord", 500);
      }
    },
  );
}
