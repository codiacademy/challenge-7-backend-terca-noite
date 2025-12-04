import { it, describe, beforeAll, afterAll, expect } from "vitest";
import { createApp } from "../../app.ts"; // Ajuste o caminho conforme sua estrutura
import { prisma } from "../../lib/prisma.ts"; // Assumindo que o prisma está disponível
import type { FastifyInstance } from "fastify";
import supertest from "supertest";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
// Variáveis para a instância da aplicação e o token de acesso
let appInstance: FastifyInstance;
let accessToken: string;
let testUserId: string;
let requestClient: supertest.Agent;

const MOCKED_USER = {
  fullName: "Verify Pass Test User",
  email: "verify.pass@codicash.com",
  password: "CorrectPassword123",
  two_factor_enabled: false,
};

// --- Testes da Rota /delete_current_user ---

describe("DELETE /delete_current_user", () => {
  beforeAll(async () => {
    appInstance = await createApp();
    await appInstance.ready();
    requestClient = supertest(appInstance.server);

    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id;

    // 3. LOGIN para obter o Token
    const loginResponse = await requestClient.post("/login").send({
      email: MOCKED_USER.email,
      password: MOCKED_USER.password,
    });

    // Assume que o accessToken é retornado no corpo da resposta
    accessToken = loginResponse.body.accessToken;
    expect(loginResponse.statusCode).toBe(200);

    // Garante que o token foi obtido
    expect(accessToken).toBeDefined();

    // Verifica se o login foi bem-sucedido e extrai o token
  });

  afterAll(async () => {
    await appInstance.close();
  });

  it("Deve deletar o usuário logado e retornar status 200", async () => {
    // A rota exige autenticação (app.authenticate), então usamos o token obtido no setup.
    const response = await requestClient.delete("/users/delete_current_user").set({
      authorization: `Bearer ${accessToken}`, // Envia o token para autenticação
    });

    // 1. Verificação da Resposta da Rota
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Usuário deletado com sucesso");
    expect(response.body.user.id).toBe(testUserId);

    // 2. Verificação no Banco de Dados (Confirmação da exclusão)
    const deletedUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });

    // O usuário não deve mais existir no banco de dados
    expect(deletedUser).toBeNull();
  });

  it("Não deve permitir a deleção sem token de autenticação", async () => {
    // Tenta acessar a rota sem enviar o header 'Authorization'
    const response = await requestClient.delete("/users/delete_current_user");

    // Deve retornar 401 Unauthorized (assumindo que app.authenticate lida com isso)
    expect(response.statusCode).toBe(401);
  });
});
