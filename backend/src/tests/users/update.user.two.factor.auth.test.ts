import { it, expect, beforeAll, afterAll, describe } from "vitest";
import { createApp } from "../../app.ts";
import type { FastifyInstance } from "fastify";
import supertest from "supertest";
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma"; // Importar o Prisma para verificar o DB

// Variáveis globais
let appInstance: FastifyInstance;
let accessToken: string;
let testUserId: string;
let requestClient: supertest.Agent;

// Dados iniciais do usuário: two_factor_enabled deve começar como false
const INITIAL_PASSWORD = "TestPassword123";
const MOCKED_USER = {
  fullName: "Two Factor Auth Test User",
  email: "tfa.test@codicash.com",
  password: INITIAL_PASSWORD,
  two_factor_enabled: false, // O ponto de partida é DESATIVADO
};

// --- Configuração E2E: Inicialização e Login ---

beforeAll(async () => {
  // 1. Inicializa o Fastify
  appInstance = await createApp();
  await appInstance.ready();
  requestClient = supertest(appInstance.server);

  // 2. CRIAÇÃO DO USUÁRIO DE TESTE
  const user = await createTestUser(MOCKED_USER);
  testUserId = user.id;

  // 3. LOGIN inicial para obter o Access Token
  const loginResponse = await requestClient.post("/login").send({
    email: MOCKED_USER.email,
    password: INITIAL_PASSWORD,
  });

  expect(loginResponse.statusCode).toBe(200);
  accessToken = loginResponse.body.accessToken;
  expect(accessToken).toBeDefined();

  // 4. Verificação inicial do DB
  const initialUser = await prisma.user.findUnique({ where: { id: testUserId } });
  expect(initialUser!.two_factor_enabled).toBe(false);
});

afterAll(async () => {
  // Limpeza do usuário do banco
  await deleteUserFunction(testUserId);
  await appInstance.close();
});

// --- Testes da Rota PATCH /update_two_factor_auth ---

describe("PATCH /update_two_factor_auth - Toggle 2FA", () => {
  it("1. Deve ativar a verificação por duas etapas (false -> true) com sucesso e retornar status 200", async () => {
    // 1. Executa a requisição PATCH
    const response = await requestClient
      .patch("/users/update_two_factor_auth")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send({}); // O body é ignorado, a rota usa apenas o userId do token

    // 2. Verificação da Resposta (200 OK)
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Verificação por duas etapas atualizada com sucesso");

    // 3. Verifica se a propriedade foi ativada na resposta
    expect(response.body.user).toHaveProperty("twoFactorAuthEnabled", true);

    // 4. Verifica no DB se a alteração foi persistida
    const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userInDb!.two_factor_enabled).toBe(true);
  });

  it("2. Deve desativar a verificação por duas etapas (true -> false) na segunda chamada", async () => {
    // A propriedade agora está como TRUE após o Teste 1.
    // 1. Executa a requisição PATCH novamente (deve desativar)
    const response = await requestClient
      .patch("/users/update_two_factor_auth")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send({});

    // 2. Verificação da Resposta (200 OK)
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Verificação por duas etapas atualizada com sucesso");

    // 3. Verifica se a propriedade foi desativada na resposta
    expect(response.body.user).toHaveProperty("twoFactorAuthEnabled", false);

    // 4. Verifica no DB se a alteração foi persistida
    const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userInDb!.two_factor_enabled).toBe(false);
  });

  it("3. Deve retornar 401 Unauthorized se o token de autenticação estiver ausente", async () => {
    // Tenta acessar a rota sem enviar o header 'Authorization'
    const response = await requestClient.patch("/users/update_two_factor_auth").send({}); // O preHandler [app.authenticate] deve bloquear

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
