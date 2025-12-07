import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { createAuthStateFunction } from "../../functions/auth/create-auth-state-function";

// --- 1. ESQUEMA DE RESPOSTA DE SUCESSO (200) ---
const authLinkDiscordResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Url Recebida",
      description: "Mensagem de status.",
    },
    authDiscordURL: {
      type: "string",
      format: "url",
      description:
        "URL completa de autorização do Discord, incluindo o token 'state' e parâmetros de servidor/permissões.",
      example:
        "https://discord.com/oauth2/authorize?client_id=...&response_type=code&state=...&guild_id=...",
    },
  },
  required: ["message", "authDiscordURL"],
};

// --- 2. ESQUEMA DE ERRO SIMPLES (401, 500) ---
const errorResponseDoc = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Mensagem de erro.",
      example: "Falha ao gerar URL de autorização.",
    },
  },
};

// --- ESQUEMA COMPLETO DA ROTA (Swagger/OpenAPI) ---
const authLinkDiscordRouteSchema = {
  tags: ["Autenticação"],
  summary: "Inicia o processo de vínculo da conta do Discord.",
  description:
    "Endpoint que requer autenticação JWT do usuário. Ele gera um token 'state' persistente e retorna a URL de autorização do Discord para que o cliente inicie o redirecionamento para o OAuth2.",
  operationId: "authLinkDiscord", // Requer autenticação JWT

  security: [{ bearerAuth: [] }], // Não há parâmetros de corpo (body) ou URL (params/querystring) na requisição
  // O ID do usuário é obtido do token JWT

  response: {
    // ✅ 200 OK
    200: {
      description: "URL de autorização do Discord gerada com sucesso.",
      ...authLinkDiscordResponseDoc,
    }, // ❌ 401 Unauthorized

    401: {
      description: "Não autorizado (Token JWT ausente ou inválido)",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    }, // ❌ 500 Internal Server Error

    500: {
      description: "Erro interno ao gerar o 'state' ou a URL de autorização.", // Note que o seu código retorna { error: "..." } no 500
      ...errorResponseDoc,
    },
  },
};
export async function authLinkDiscordRoute(app: FastifyInstance) {
  app.get(
    "/discord/link",
    { preHandler: [app.authenticate], schema: authLinkDiscordRouteSchema },
    async (request, reply) => {
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
          app.oauth2DiscordOAuth2?.generateAuthorizationUri(
            request,
            reply,
            (err, authorizationEndpoint) => {
              if (err) {
                app.log.error(err, "Erro ao gerar URI de autorização");
                // Se houver um erro, rejeita a Promise e envia a resposta de erro
                reply.code(500).send({ error: "Falha ao gerar URL de autorização." });
                return reject(err); // Rejeita a Promise
              }

              let authDiscordURL = injectStateIntoUrl(
                authorizationEndpoint,
                createdAuthState.state,
              );

              authDiscordURL = injectGuildParamsIntoUrl(
                authDiscordURL,
                process.env.DISCORD_TARGET_GUILD_ID,
                process.env.BOT_REQUIRED_PERMISSIONS_INT,
              );
              // Se for sucesso, envia a resposta de sucesso e resolve a Promise
              reply.code(200).send({ message: "Url Recebida", authDiscordURL });
              console.log("URL de Autorização do Discord (FINAL): " + authDiscordURL);
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
    },
  );
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

function injectGuildParamsIntoUrl(
  url: string,
  guildId: string | undefined,
  permissionsInt: string | undefined,
): string {
  const separator = url.includes("?") ? "&" : "?"; // 1. Define os parâmetros para a instalação do Bot
  // guild_id: O ID do servidor alvo (o seu servidor Codi Cash)
  // disable_guild_select=true: Impede que o usuário escolha outro servidor
  // permissions: O inteiro que define as permissões que o Bot precisa
  const guildParams = [
    `guild_id=${guildId}`,
    `disable_guild_select=true`,
    `permissions=${permissionsInt}`, // 🚨 IMPORTANTE: Se o seu plugin NÃO incluir o scope 'bot' na URL,
    // você precisará adicioná-lo manualmente aqui, ou ele não funcionará.
    // Ex: `scope=identify%20bot` (assumindo que 'identify' é o outro scope)
  ]; // 2. Anexa os parâmetros à URL

  return `${url}${separator}${guildParams.join("&")}`;
}
