import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import { env } from "./config/env.ts";
import { swaggerConfi } from "./config/swagger.ts";
import { createUserRoute } from "./routes/users/create-user-route.ts";
import { deleteUserRoute } from "./routes/users/delete-user-route.ts";
import { authLoginRoute } from "./routes/auth/auth-login-route.ts";
import { readUserProfileRoute } from "./routes/users/read-user-profile-route.ts";
import { updateUserProfileRoute } from "./routes/users/update-user-profile-route.ts";
import { authLogoutRoute } from "./routes/auth/auth-logout-route.ts";
import { authRefreshRoute } from "./routes/auth/auth-refresh-route.ts";
import { isRefreshTokenValid } from "./utils/tokens-service.ts";
import fp from "./plugins/fastify-plugin.ts";
import { updateUserEmailNotificationRoute } from "./routes/users/update-user-email-notification-route.ts";
import { updateUserSmsNotificationRoute } from "./routes/users/update-user-sms-notification.ts";
import { twoFactorVerifyRoute } from "./routes/auth/two-factor-verify-route.ts";

export const app = Fastify({ logger: true });

await swaggerConfi(app);

app.register(cors, {
  origin: ["http://localhost:5173", "http://192.168.2.102:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // <--- adicione PATCH aqui
  allowedHeaders: ["Content-Type", "Authorization"], // ajuste conforme o necessário
  credentials: true,
});
app.register(fastifyJwt, { secret: env.JWT_SECRET });
app.register(cookie, {
  secret: env.COOKIE_SECRET, // opcional, caso queira cookies assinados
  // outras opções
});
import type { Payload } from "./types/auth/refresh-token-types.ts";
import { twoFactorSendRoute } from "./routes/auth/two-factor-send-route.ts";
fp(app);
app.decorate("authenticate", async (request: any, reply: any) => {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return reply.status(401).send({ message: "Token ausente" });
    }

    const token = authHeader.split(" ")[1];
    console.log("token =" + token);
    const decoded = await app.jwt.verify<Payload>(token);

    // então:
    request.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (err) {
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
app.register(updateUserSmsNotificationRoute, { prefix: "/users" });
app.register(twoFactorSendRoute, { prefix: "/2fa" });
app.register(twoFactorVerifyRoute, { prefix: "/2fa" });
app.get("/", { preHandler: [app.authenticate] }, async (request, reply) => {
  return "Codi Cash API rodando! Acesse /docs para a documentação.";
});
