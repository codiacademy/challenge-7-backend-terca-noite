import Fastify from "fastify";
import fp from "fastify-plugin";
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
export const app = Fastify({ logger: true });

await swaggerConfi(app);

app.register(cors, { origin: "*" });
app.register(fastifyJwt, { secret: env.JWT_SECRET });
app.register(cookie, {
  secret: env.COOKIE_SECRET, // opcional, caso queira cookies assinados
  // outras opções
});

app.register(createUserRoute, { prefix: "/users" });
app.register(deleteUserRoute, { prefix: "/users" });
app.register(readUserProfileRoute, { prefix: "/users" });
app.register(updateUserProfileRoute, { prefix: "/users" });
app.register(authLogoutRoute);
app.register(authRefreshRoute);
app.register(authLoginRoute);

app.get("/", async (request, reply) => {
  return "Codi Cash API rodando! Acesse /docs para a documentação.";
});

app.decorate("authenticate", async (request: any, reply: any) => {
  try {
    const decoded = await request.jwtVerify();
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
