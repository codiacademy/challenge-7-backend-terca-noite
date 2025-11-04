// auth.service.ts (ou função utilitária)
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.ts";
export async function generateTokens(
  fastify: FastifyInstance,
  payload: { userId: string; email: string; name: string },
) {
  const accessToken = await fastify.jwt.sign(
    {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      type: "access",
    },
    { expiresIn: env.JWT_EXPIRES_IN },
  );

  const refreshToken = await fastify.jwt.sign(
    {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      type: "refresh",
    },
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );

  return { accessToken, refreshToken };
}
