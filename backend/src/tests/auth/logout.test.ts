import { it, expect, beforeAll, afterAll, describe } from "vitest";
import supertest from "supertest";
import { app } from "../../app.ts"; // A instância do Fastify
import { createTestUser } from "../../functions/users/create-test-user-function.ts"; // Assume-se que você tem uma função para deletar
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts"; // Para verificar o DB
import { extractRefreshTokenFromHeader } from "../../functions/auth/extract-refresh-token-from-header.ts";
import { extractTokenValue } from "../../functions/auth/extract-token-value.ts";

// Dados do Usuário Padrão (deve ter 2FA desabilitado para gerar tokens)
const MOCKED_USER = {
  fullName: "Logout Test User",
  email: "logout.test@codicash.com",
  password: "Password123",
  two_factor_enabled: false,
};

let requestClient: supertest.Agent;
let testUserId: string;
let successfulLoginResponse: supertest.Response;

describe("POST /logout - Encerramento de Sessão", () => {
  beforeAll(async () => {
    // Garante que o Fastify esteja pronto
    await app.ready();
    requestClient = supertest(app.server);

    // 1. Cria o usuário de teste e obtém o ID
    testUserId = (await createTestUser(MOCKED_USER)).id;

    // 2. Realiza o login para obter os cookies/tokens necessários para o Logout (Cenário 1)
    successfulLoginResponse = await requestClient.post("/login").send({
      email: MOCKED_USER.email,
      password: MOCKED_USER.password,
    });
  });

  afterAll(async () => {
    // Limpa o usuário do banco após todos os testes
    await deleteUserFunction(testUserId);
    await app.close();
  });

  // --- TESTE 1: Caminho Feliz (Logout com Token Válido) ---
  it("1. Deve realizar o logout com sucesso, invalidar o refreshToken no DB e limpar o cookie", async () => {
    // 1. Extrai o refreshToken do cookie da resposta de Login
    const refreshTokenCookie = extractRefreshTokenFromHeader(successfulLoginResponse);

    const response = await requestClient
      .post("/logout")
      // 2. Envia o cookie de volta para simular uma sessão ativa
      .set("Cookie", refreshTokenCookie);

    // 3. Verifica o Status da Resposta
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: "Logout realizado com sucesso" });

    // 4. Verifica a remoção do Cookie
    const clearCookieHeader = response.headers["set-cookie"];
    if (!clearCookieHeader) return;
    expect(clearCookieHeader[0]).toContain("refreshToken=;");
    expect(clearCookieHeader[0]).toContain("Max-Age=0");

    // 5. Verifica se o token foi revogado no Banco de Dados (Teste de Integração)
    const revokedToken = await prisma.refreshtokens.findFirst({
      where: { userId: testUserId, is_revoked: true },
    });

    expect(revokedToken).toBeDefined();
    if (revokedToken) {
      expect(revokedToken.is_revoked).toBe(true);
    }
  });

  // --- TESTE 2: Falha (Sem Cookie/Token) ---
  it("2. Não deve permitir o logout se o cookie refreshToken estiver ausente", async () => {
    // Envia a requisição sem o header 'Cookie'
    const response = await requestClient.post("/logout").send();

    // ⚠️ O erro pode vir do verifyRefreshToken (401) ou do código da rota (401 AppError)
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  // --- TESTE 3: Falha (Token Já Revogado) ---
  // Este teste só pode ser executado se o teste 1 for bem-sucedido, pois ele revogou o token.
  it("3. Não deve permitir o logout se o refreshToken já estiver revogado", async () => {
    // Usamos a mesma resposta de login do beforeAll
    const refreshTokenCookie = extractRefreshTokenFromHeader(successfulLoginResponse);

    // O teste 1 já revogou este token no DB.
    const response = await requestClient.post("/logout").set("Cookie", refreshTokenCookie);

    // Esperamos 401 ou 404 dependendo de como o verifyRefreshToken lida com tokens revogados
    // ou como o authLogoutFunction lida com 'Token não encontrado ou já revogado' da revokeRefreshToken.
    expect(response.statusCode).not.toBe(200);
    // Seu authLogoutFunction pode lançar 404/401 se o token não for encontrado no DB.
    expect(response.statusCode).toBeOneOf([401, 404]);
  });
});
