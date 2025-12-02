import { it, expect, beforeAll, afterAll, describe } from "vitest";
import { createApp } from "../../app.ts";
import type { FastifyInstance } from "fastify";
import supertest from "supertest";
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";

// Variáveis globais para a instância da aplicação, token e ID do usuário de teste
let appInstance: FastifyInstance;
let accessToken: string;
let testUserId: string;
let requestClient: supertest.Agent;

// Senhas de teste
const OLD_PASSWORD = "OldPassword123";
const NEW_PASSWORD = "NewStrongPassword456";

// Dados do usuário mockado
const MOCKED_USER = {
  fullName: "Password Update Test User",
  email: "password.update.test@codicash.com",
  password: OLD_PASSWORD, // Começa com a senha antiga
  two_factor_enabled: false,
};

// --- Configuração E2E: Inicialização e Login ---

beforeAll(async () => {
  // 1. Inicializa o Fastify
  appInstance = await createApp();
  await appInstance.ready();
  requestClient = supertest(appInstance.server); // 2. CRIAÇÃO DO USUÁRIO DE TESTE

  const user = await createTestUser(MOCKED_USER);
  testUserId = user.id; // 3. LOGIN inicial para obter o Access Token

  const loginResponse = await requestClient.post("/login").send({
    email: MOCKED_USER.email,
    password: MOCKED_USER.password,
  }); // Verifica se o login inicial foi bem-sucedido

  expect(loginResponse.statusCode).toBe(200);
  accessToken = loginResponse.body.accessToken;

  expect(accessToken).toBeDefined();
});

afterAll(async () => {
  // Limpeza do usuário do banco
  await deleteUserFunction(testUserId);
  await appInstance.close();
});

// --- Testes da Rota PATCH /update_password ---

describe("PATCH /update_password - Atualização de Senha", () => {
  it("1. Deve atualizar a senha com sucesso e retornar status 200", async () => {
    // 1. Executa a requisição PATCH para atualizar a senha
    const response = await requestClient
      .patch("/users/update_password")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send({
        password: NEW_PASSWORD,
      }); // 2. Verificação da Resposta (200 OK)

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Senha do usuário atualizada com sucesso"); // O corpo deve conter o usuário atualizado (sem a senha hash)
    expect(response.body.user).toHaveProperty("id", testUserId);
    expect(response.body.user).not.toHaveProperty("password_hash");
  });

  it("2. Deve falhar ao tentar logar com a senha ANTIGA após a atualização (segurança)", async () => {
    // Tenta logar com a senha que foi alterada no Teste 1
    const response = await requestClient.post("/login").send({
      email: MOCKED_USER.email,
      password: OLD_PASSWORD,
    }); // O login deve falhar (401 Unauthorized ou similar, dependendo da sua rota de login)

    expect(response.statusCode).not.toBe(200);
    expect(response.body).toHaveProperty("message");
  });

  it("3. Deve ter sucesso ao logar com a senha NOVA após a atualização (funcionalidade)", async () => {
    // Tenta logar com a senha nova, alterada no Teste 1
    const response = await requestClient.post("/login").send({
      email: MOCKED_USER.email,
      password: NEW_PASSWORD,
    }); // O login deve ser bem-sucedido

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
  });

  it("4. Deve retornar 400 Bad Request se a nova senha for muito curta (Zod Validation)", async () => {
    // 1. Executa a requisição PATCH com senha inválida
    const response = await requestClient
      .patch("/users/update_password")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send({
        password: "short", // Menos de 8 caracteres
      }); // 2. Verificação da Resposta (400 Bad Request)

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Dados de entrada em formato inválido");
    expect(response.body).toHaveProperty("errors");
  });

  it("5. Deve retornar 401 Unauthorized se o token de autenticação estiver ausente", async () => {
    // Tenta acessar a rota sem enviar o header 'Authorization'
    const response = await requestClient.patch("/users/update_password").send({
      password: NEW_PASSWORD,
    }); // O preHandler [app.authenticate] deve bloquear

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
