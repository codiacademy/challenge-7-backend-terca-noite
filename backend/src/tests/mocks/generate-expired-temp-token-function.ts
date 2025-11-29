import type { FastifyInstance } from "fastify";

export async function generateExpiredTempTokenFunction(
  appInstance: FastifyInstance,
  payload: any,
): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const oneHourAgo = nowInSeconds - 3600;

  const expiredToken = await appInstance.jwt.sign({
    ...payload,
    type: "2fa_pending",
    exp: oneHourAgo,
    iat: nowInSeconds,
  });
  return expiredToken;
}
