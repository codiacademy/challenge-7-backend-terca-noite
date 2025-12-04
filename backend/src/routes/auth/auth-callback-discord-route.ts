import type { FastifyInstance } from "fastify";

import { AppError } from "../../utils/app-error";
import { getDiscordUserFunction } from "../../functions/users/get-discord-user-function";
import { updateDiscordUserInfos } from "../../functions/users/update-discord-user-infos-function";
import { getUserIdFromAuthStateFunction } from "../../functions/auth/get-userId-from-auth-state-function";
import axios from "axios";

export async function AuthCallbackDiscordRoute(app: FastifyInstance) {
  app.get("/discord/callback", async (request, reply) => {
    // gera a URL de autorização

    const query = request.query as { code?: string; state?: string; error?: string };

    if (query.error) {
      app.log.warn(`Vínculo do Discord cancelado pelo usuário. Erro: ${query.error}`);

      // Se o usuário cancelou, redirecione-o de volta para a tela de settings (Front)
      return reply.redirect("http://localhost:5173/settings");
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
        console.error("Erro ao adicionar usuário ao servidor Discord:", err.response?.data || err);
        // Não impede o vínculo; apenas registra erro
      }
      reply.redirect("http://localhost:5173/settings");
    } catch (error: any) {
      console.log(error);
      throw new AppError("Erro ao redirecionar para vincular discord", 500);
    }
  });
}
