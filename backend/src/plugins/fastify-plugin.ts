import fp from "fastify-plugin";
import { AppError } from "../utils/app-error.ts";
import { isRefreshTokenValid } from "../utils/tokens-service.ts";
import type { Payload } from "../types/auth/refresh-token-types.ts";
export default fp(async (app) => {
  app.decorate("verifyRefreshToken", async (request: any, reply: any) => {
    try {
      app.log.info("Verificando refresh token...");
      const refreshToken = request.cookies?.refreshToken;
      if (!refreshToken) {
        return reply.status(401).send({ message: "Refresh token ausente" });
      }

      const decoded = app.jwt.verify<Payload>(refreshToken);
      const isValid = await isRefreshTokenValid(decoded.id, refreshToken);
      if (!isValid) {
        throw new AppError("Token inválido", 401);
      }
      request.user = { id: decoded.id };
    } catch (err) {
      return reply.status(401).send({ message: "Refresh token inválido" });
    }
  });
});
