import type { FastifyInstance } from "fastify";

import { AppError } from "../../utils/app-error.ts";
import { getDiscordUserFunction } from "../../functions/users/get-discord-user-function.ts";
import { updateDiscordUserInfos } from "../../functions/users/update-discord-user-infos-function.ts";
import { getUserIdFromAuthStateFunction } from "../../functions/auth/get-userId-from-auth-state-function.ts";
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
      reply.redirect("http://localhost:5173/settings");
    } catch (error: any) {
      console.log(error);
      throw new AppError("Erro ao redirecionar para vincular discord", 500);
    }
  });
}
