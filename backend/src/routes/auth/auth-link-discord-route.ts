import type { FastifyInstance } from "fastify";

import { AppError } from "../../utils/app-error.ts";
import { createAuthStateFunction } from "../../functions/auth/create-auth-state-function.ts";
import { randomUUID } from "crypto";

export async function authLinkDiscordRoute(app: FastifyInstance) {
  app.get("/discord/link", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      if (!app.oauth2DiscordOAuth2) {
        throw new AppError("Erro ao encontrar plugin de autenticação do discord");
      }

      // 1. Await na função assíncrona (Correto)
      const createdAuthState = await createAuthStateFunction(
        request.user.id,
        new Date(Date.now() + 600000),
      );

      // 2. Retorna uma nova Promise para encapsular o callback
      return new Promise<void>((resolve, reject) => {
        app.oauth2DiscordOAuth2.generateAuthorizationUri(
          request,
          reply,
          (err, authorizationEndpoint) => {
            if (err) {
              app.log.error(err, "Erro ao gerar URI de autorização");
              // Se houver um erro, rejeita a Promise e envia a resposta de erro
              reply.code(500).send({ error: "Falha ao gerar URL de autorização." });
              return reject(err); // Rejeita a Promise
            }

            const authDiscordURL = injectStateIntoUrl(
              authorizationEndpoint,
              createdAuthState.state,
            );
            // Se for sucesso, envia a resposta de sucesso e resolve a Promise
            reply.code(200).send({ message: "Url Recebida", authDiscordURL });
            console.log("url:" + authorizationEndpoint);
            return resolve(); // Resolve a Promise
          },
        );
      });
    } catch (error: any) {
      // Este catch pegará erros de 'AppError', 'createAuthStateFunction' ou rejeições da Promise acima
      app.log.error("Erro ao fazer link com Discord", error);
      console.log(error);

      // 3. Garante que o handler retorne a resposta de erro
      return reply.code(500).send({ error: "Falha ao gerar link" });
    }
  });
}

function injectStateIntoUrl(url: string, generatedState: string): string {
  // 1. Codifica o valor do estado para garantir que seja seguro para URL
  const encodedState = encodeURIComponent(generatedState);

  // 2. Cria o novo par chave=valor
  const newStateParam = `state=${encodedState}`;

  // 3. Regex para encontrar "state=" e o que vier depois (até & ou fim da string)
  // O padrão (\w*)|([^&]*) captura o valor atual do state.
  const regex = /(state=)(\w*|[^&]*)/i;

  // 4. Verifica se a URL já contém o parâmetro 'state'
  if (url.includes("state=")) {
    // Se já existe, substitui o valor existente
    return url.replace(regex, `$1${encodedState}`);
  } else {
    // Se não existe (o que é improvável no seu caso, mas bom ter),
    // anexa o novo parâmetro. Assume que a URL já tem um '?' ou '?' no final.
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${newStateParam}`;
  }
}
