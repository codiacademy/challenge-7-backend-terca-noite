import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import fastifyOauth2 from "@fastify/oauth2";
import { randomUUID } from "crypto";
import { ENV } from "./config/env";
import { swaggerConfi } from "./config/swagger";
import { createUserRoute } from "./routes/users/create-user-route";
import { deleteUserRoute } from "./routes/users/delete-current-user-route";
import { authLoginRoute } from "./routes/auth/auth-login-route";
import { readUserProfileRoute } from "./routes/users/read-user-profile-route";
import { updateUserProfileRoute } from "./routes/users/update-user-profile-route";
import { authLogoutRoute } from "./routes/auth/auth-logout-route";
import { authRefreshRoute } from "./routes/auth/auth-refresh-route";
import fp from "./plugins/fastify-plugin";
import { updateUserEmailNotificationRoute } from "./routes/users/update-user-email-notification-route";
import { updateUserDiscordNotificationRoute } from "./routes/users/update-user-discord-notification-route";
import { twoFactorVerifyRoute } from "./routes/auth/two-factor-verify-route";
import type { Payload } from "./types/auth/refresh-token-types.ts";
import { updateUserTwoFactorAuthRoute } from "./routes/users/update-user-two-factor-auth-route";
import { resendTwoFactor } from "./routes/auth/resend-two-factor-route";
import { verifyPasswordRoute } from "./routes/auth/verify-password-route";
import { updateUserPasswordRoute } from "./routes/users/update-user-password-route";
import { verifyEmailRoute } from "./routes/auth/verify-email-route";
import { resetPasswordRoute } from "./routes/auth/reset-password-route";
import { createSaleRoute } from "./routes/sales/create-sale-route";
import { updateSaleRoute } from "./routes/sales/update-sale-route";
import { readAllSalesRoute } from "./routes/sales/read-all-sales-route";
import { deleteSaleRoute } from "./routes/sales/delete-sale-route";
import { readFilteredSalesRoute } from "./routes/sales/read-filtered-sales-route";
import { readDateFilteredSalesRoute } from "./routes/sales/read-date-filtered-sales-route";
import { getSalesChartsDataRoute } from "./routes/sales/get-sales-charts-data-route";
import { getSalesKPIsRoute } from "./routes/sales/get-sales-kpis-data-route";
import { createExpenseRoute } from "./routes/expenses/create-expense-route";
import { readFilteredExpensesRoute } from "./routes/expenses/read-filtered-expenses-route";
import { deleteExpenseRoute } from "./routes/expenses/delete-expense-route";
import { updateExpenseRoute } from "./routes/expenses/update-expense-route";
import { getExpensesChartsDataRoute } from "./routes/expenses/get-expenses-charts-route";
import { getExpensesKPIsRoute } from "./routes/expenses/get-expenses-kpis-data-route";
import { getOverviewKPIsRoute } from "./routes/overview/get-overview-kpis-data-route";
import { getOverviewChartsDataRoute } from "./routes/overview/get-overview-charts-data-route";
import { authLinkDiscordRoute } from "./routes/auth/auth-link-discord-route";
import { AuthCallbackDiscordRoute } from "./routes/auth/auth-callback-discord-route";
import { authUnlinkDiscordRoute } from "./routes/auth/auth-unlink-discord-route";
import { getDiscordLinkedRoute } from "./routes/auth/get-discord-linked-route";
import { getAuthStateFunction } from "./functions/auth/get-auth-state-function";
import type { FastifyInstance } from "fastify";

export async function createApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  await swaggerConfi(app);

  app.register(cors, {
    origin: ["http://localhost:5173", "http://192.168.2.102:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });
  app.register(fastifyJwt, { secret: ENV.JWT_SECRET });
  app.register(cookie, {
    secret: ENV.COOKIE_SECRET, // opcional, caso queira cookies assinados
    // outras opções
  });

  app.register(fastifyOauth2, {
    name: "discordOAuth2", // nome para referenciar depois
    credentials: {
      client: {
        id: process.env.DISCORD_CLIENT_ID!,
        secret: process.env.DISCORD_CLIENT_SECRET!,
      }, // usar a configuração pronta para Discord
      auth: fastifyOauth2.DISCORD_CONFIGURATION,
    },
    startRedirectPath: "/auth/discord/redirect-automatico",
    scope: ["identify", "email", "guilds.join"],
    callbackUri: "http://localhost:3000/auth/discord/callback",
    generateStateFunction: async function (request: any) {
      return randomUUID();
    },
    checkStateFunction: async (request) => {
      const query = request.query as { state?: string };
      const fullState = query.state;

      if (!fullState) {
        throw new Error("Parâmetro 'state' ausente na requisição de callback.");
      }
      const state = fullState.substring(0, 36);

      try {
        const authState = await getAuthStateFunction(state);

        (request as any).authState = authState;
        return true;
      } catch (error) {
        console.error("Falha na validação do state:", (error as Error).message);
        throw new Error("Invalid state: Sessão de vínculo expirada ou inválida.");
      }
    },
  });

  fp(app);
  app.decorate("authenticate", async (request: any, reply: any) => {
    try {
      const authHeader = request.headers.authorization;
      console.log("Auth Header:", authHeader);
      if (!authHeader) {
        return reply.status(401).send({ message: "Token ausente" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = await app.jwt.verify<Payload>(token); // então:

      request.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
      };
    } catch (err) {
      console.log("Erro", err);
      return reply.status(401).send({ message: "Token inválido ou ausente" });
    }
  });
  app.register(createUserRoute, { prefix: "/users" });
  app.register(deleteUserRoute, { prefix: "/users" });
  app.register(readUserProfileRoute, { prefix: "/users" });
  app.register(updateUserProfileRoute, { prefix: "/users" });
  app.register(authLogoutRoute);
  app.register(authRefreshRoute);
  app.register(authLoginRoute);
  app.register(updateUserEmailNotificationRoute, { prefix: "/users" });
  app.register(updateUserDiscordNotificationRoute, { prefix: "/users" });
  app.register(updateUserPasswordRoute, { prefix: "/users" });
  app.register(updateUserTwoFactorAuthRoute, { prefix: "/users" });
  app.register(twoFactorVerifyRoute, { prefix: "/2fa" });
  app.register(resendTwoFactor, { prefix: "/2fa" });
  app.register(verifyPasswordRoute, { prefix: "/auth" });
  app.register(verifyEmailRoute, { prefix: "/auth" });
  app.register(resetPasswordRoute, { prefix: "/users" });
  app.register(createSaleRoute, { prefix: "/sales" });
  app.register(updateSaleRoute, { prefix: "/sales" });
  app.register(readAllSalesRoute, { prefix: "/sales" });
  app.register(deleteSaleRoute, { prefix: "/sales" });
  app.register(readFilteredSalesRoute, { prefix: "/sales" });
  app.register(readDateFilteredSalesRoute, { prefix: "/sales" });
  app.register(getSalesChartsDataRoute, { prefix: "/sales" });
  app.register(getSalesKPIsRoute, { prefix: "/sales" });
  app.register(createExpenseRoute, { prefix: "/expenses" });
  app.register(readFilteredExpensesRoute, { prefix: "/expenses" });
  app.register(deleteExpenseRoute, { prefix: "/expenses" });
  app.register(updateExpenseRoute, { prefix: "/expenses" });
  app.register(getExpensesChartsDataRoute, { prefix: "/expenses" });
  app.register(getExpensesKPIsRoute, { prefix: "/expenses" });
  app.register(getOverviewKPIsRoute, { prefix: "/overview" });
  app.register(getOverviewChartsDataRoute, { prefix: "/overview" });
  app.register(authLinkDiscordRoute, { prefix: "/auth" });
  app.register(AuthCallbackDiscordRoute, { prefix: "/auth" });
  app.register(authUnlinkDiscordRoute, { prefix: "/auth" });
  app.register(getDiscordLinkedRoute, { prefix: "/auth" });
  app.get("/", { preHandler: [app.authenticate] }, async (request, reply) => {
    return "Codi Cash API rodando! Acesse /docs para a documentação.";
  }); // ------------------------------------------------------------------
  // ESTE É O RETURN QUE ESTAVA FALTANDO OU INACESSÍVEL NO SEU ERRO!
  // ------------------------------------------------------------------

  return app;
}
