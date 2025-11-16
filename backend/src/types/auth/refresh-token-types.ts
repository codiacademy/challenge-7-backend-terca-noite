import type { FastifyInstance } from "fastify";

export interface Payload {
  id: string;
  email: string;
  name: string;
  type: "refresh" | "access" | "2fa_pending";
  iat?: number;
  exp?: number;
}

export type DecodedToken = {
  id: string;
  email: string;
  name: string;
};

export type SaveRefreshTokenType = {
  userId: string;
  refreshToken: string;
  expiresAt: string;
};

export type CheckRefreshTokenType = {
  userId: string;
  decodedToken: DecodedToken;
  refreshToken: string;
};
