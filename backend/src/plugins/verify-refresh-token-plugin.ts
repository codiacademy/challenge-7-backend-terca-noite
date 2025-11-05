import fp from "fastify-plugin";
import { AppError } from "../utils/app-error.ts";
import { isRefreshTokenValid } from "../utils/tokens-service.ts";

export default fp(
  async (app) => {
    app.decorate("verifyRefreshToken", async (request: any, reply: any) => {
      try {
        app.log.info("Verificando refresh token...");
        const refreshToken = request.cookies?.refreshToken;
        if (!refreshToken) {
          return reply.status(401).send({ message: "Refresh token ausente" });
        }

        const decoded = app.jwt.verify<{ userId: string }>(refreshToken);
        const isValid = await isRefreshTokenValid(decoded.userId, refreshToken);
        if (!isValid) {
          throw new AppError("Token inválido", 401);
        }
        request.user = { id: decoded.userId };
      } catch (err) {
        return reply.status(401).send({ message: "Refresh token inválido" });
      }
    });
  },
  { name: "authDecorators" },
);
