import type { FastifyInstance } from "fastify";

export interface RefreshPayload {
  userId: string;
  email: string;
  name: string;
  type: "refresh";
  iat?: number;
  exp?: number;
}

export type DecodedToken = {
  userId: string;
  email: string;
  name: string;
};

export type SaveRefreshTokenType = {
  userId: string;
  refreshToken: string;
  expiresAt: string;
};

export type CheckRefreshTokenType = {
  app: FastifyInstance;
  userId: string;
  decodedToken: DecodedToken;
  refreshToken: string;
};
