import { it, expect, beforeAll, afterAll, describe } from "vitest";
import supertest from "supertest";
import { createApp } from "../../app.ts"; // Importa a função fábrica
import type { FastifyInstance } from "fastify"; // Importa o tipo FastifyInstance;
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts";
import { extractRefreshTokenFromHeader } from "../../functions/auth/extract-refresh-token-from-header.ts";
import { extractTokenValue } from "../../functions/auth/extract-token-value.ts";
import bcrypt from "bcrypt";
import type { refreshtokens } from "@prisma/client";
// Dados do Usuário Padrão
const MOCKED_USER = {
  fullName: "Refresh Test User",
  email: "refresh.test@codicash.com",
  password: "Password123",
  two_factor_enabled: false,
};

let requestClient: supertest.Agent;
let testUserId: string;
let initialRefreshTokenCookie: string;
let appInstance: FastifyInstance;
// Função auxiliar para extrair o valor do token da string do cookie

async function waitForTokenRevocation(
  userId: string,
  tokenValue: string | undefined,
  timeout = 5000, // Tempo máximo de espera em ms
  interval = 20, // Intervalo de polling em ms
): Promise<refreshtokens> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const refreshTokens = await prisma.refreshtokens.findMany({
      where: { userId: userId },
    });

    for (const tokenRecord of refreshTokens) {
      const isMatch = await bcrypt.compare(tokenValue as string, tokenRecord.tokenHash);
      if (isMatch) {
        // Encontrou o registro do token. Verifica se foi revogado.
        if (tokenRecord.is_revoked) {
          return tokenRecord; // Sucesso: Token revogado!
        }
      }
    } // Se não revogou, espera e tenta novamente

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(
    `Timeout atingido (${timeout}ms). O token com valor ${tokenValue} não foi revogado.`,
  );
}

describe("POST /refresh - Renovação de Token", () => {
  beforeAll(async () => {
    appInstance = await createApp();
    await appInstance.ready();
    requestClient = supertest(appInstance.server);

    // 1. Cria o usuário de teste
    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id;

    // 2. Realiza o login para obter o primeiro refreshToken válido
    const loginResponse = await requestClient.post("/login").send({
      email: MOCKED_USER.email,
      password: MOCKED_USER.password,
    });

    if (loginResponse.statusCode !== 200) {
      throw new Error("Falha no login inicial para o teste de refresh.");
    }

    // Armazena o cookie do primeiro refresh token para uso e revogação
    initialRefreshTokenCookie = extractRefreshTokenFromHeader(loginResponse);
  });

  afterAll(async () => {
    await deleteUserFunction(testUserId);
    await appInstance.close();
  });

  // --- TESTE 1: Caminho Feliz (Geração de Novos Tokens) ---
  it("1. Deve gerar um novo accessToken e refreshToken e revogar o token antigo", async () => {
    const oldTokenValue = extractTokenValue(initialRefreshTokenCookie);

    // 1. Faz a requisição de refresh com o token inicial válido
    const response = await requestClient.post("/refresh").set("Cookie", initialRefreshTokenCookie);

    // 2. Verifica a Resposta
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body.message).toBe("Refresh Token gerado com sucesso.");

    // 3. Verifica o Novo Refresh Token no Cookie
    const newRefreshTokenCookie = extractRefreshTokenFromHeader(response);
    const newRefreshTokenValue = extractTokenValue(newRefreshTokenCookie);

    // O novo token deve ser diferente do antigo
    expect(newRefreshTokenValue).not.toBe(oldTokenValue);

    try {
      const foundOldTokenRecord = await waitForTokenRevocation(testUserId, oldTokenValue); // O token antigo deve estar marcado como revogado
      expect(foundOldTokenRecord).toBeDefined();
      expect(foundOldTokenRecord.is_revoked).toBe(true);
    } catch (error) {
      // Se der timeout, o teste falha
      console.error("Falha ao verificar revogação no DB:", error);
      throw error;
    }
  });

  // --- TESTE 2: Falha (Token Antigo e Revogado) ---
  it("2. Não deve permitir o refresh com o token antigo (revogado no teste anterior)", async () => {
    const rawRevokedToken = "revoked-token-for-test-2";

    // 2. Criar o hash correspondente
    const hashedRevokedToken = await bcrypt.hash(rawRevokedToken, 10);

    // 3. Criar o refresh token no banco já revogado
    const revokedRefreshToken = await prisma.refreshtokens.create({
      data: {
        userId: testUserId,
        tokenHash: hashedRevokedToken,
        is_revoked: true,
        expiresAt: String(new Date(Date.now() + 1000 * 60 * 60)), // +1h
      },
    });

    const revokedCookie = `refreshToken=${rawRevokedToken}; Path=/; HttpOnly`;

    const response = await requestClient.post("/refresh").set("Cookie", revokedCookie);
    // Espera-se 403 (Forbidden) ou 401 (Unauthorized) do isRefreshTokenValid
    expect(response.statusCode).toBeOneOf([401, 403]);
    expect(response.body).toHaveProperty("message");
  });

  // --- TESTE 3: Falha (Sem Cookie/Token) ---
  it("3. Não deve permitir o refresh se o cookie refreshToken estiver ausente", async () => {
    // Envia a requisição sem o header 'Cookie'
    const response = await requestClient.post("/refresh").send();

    // O preHandler (verifyRefreshToken) deve bloquear
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  // --- TESTE 4: Falha (Token com Assinatura Inválida / Não Decodificável) ---
  it("4. Não deve permitir o refresh com um token JWT malformado ou inválido", async () => {
    const invalidCookie =
      "refreshToken=INVALID_JWT_TOKEN.1234567890.INVALID_SIGNATURE; Path=/; HttpOnly";

    const response = await requestClient.post("/refresh").set("Cookie", invalidCookie);

    // Espera-se 401 (Unauthorized) do app.jwt.verify no preHandler
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
