import { it, expect, beforeAll, afterAll, describe } from "vitest";
import { createApp } from "../../app.ts"; // Ajuste o caminho conforme sua estrutura
import { prisma } from "../../lib/prisma.ts";
import type { FastifyInstance } from "fastify";
import supertest from "supertest";
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";

// Variáveis globais para a instância da aplicação, token e ID do usuário de teste
let appInstance: FastifyInstance;
let accessToken: string;
let testUserId: string;
let requestClient: supertest.Agent;

// Dados do usuário mockado (Adicionando telefone para testar todos os campos do SELECT)
const MOCKED_USER = {
  fullName: "Profile Read Test User",
  email: "profile.read.test@codicash.com",
  password: "CorrectPassword123",
  two_factor_enabled: false,
  telephone: "9912345678", // Exemplo de telefone
};

// --- Configuração E2E: Inicialização e Login ---

beforeAll(async () => {
  // 1. Inicializa o Fastify
  appInstance = await createApp();
  await appInstance.ready();
  requestClient = supertest(appInstance.server); // 2. CRIAÇÃO DO USUÁRIO DE TESTE (Usando a função de helper)
  // Usamos um objeto que inclui todos os campos que a função de leitura espera

  const user = await createTestUser(MOCKED_USER);
  testUserId = user.id; // 3. LOGIN para obter o Token

  const loginResponse = await requestClient.post("/login").send({
    email: MOCKED_USER.email,
    password: MOCKED_USER.password,
  }); // Verifica se o login foi bem-sucedido e extrai o token

  expect(loginResponse.statusCode).toBe(200);
  accessToken = loginResponse.body.accessToken; // Garante que o token foi obtido

  expect(accessToken).toBeDefined();
});

afterAll(async () => {
  // Limpeza do usuário do banco
  await deleteUserFunction(testUserId);
  await appInstance.close();
});

// --- Testes da Rota /read_profile ---

describe("GET /read_profile - Leitura de Perfil do Usuário Autenticado", () => {
  it("1. Deve retornar status 200 e os dados completos do perfil do usuário logado", async () => {
    // A rota exige autenticação (app.authenticate), então usamos o token obtido no setup.
    const response = await requestClient.get("/users/read_profile").set({
      authorization: `Bearer ${accessToken}`, // Envia o token para autenticação
    }); // 1. Verificação da Resposta da Rota

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Perfil do usuário obtido com sucesso"); // 2. Verificação dos Campos (Garante que o SELECT na função está correto)

    const user = response.body.user; // Campos de identificação

    expect(user.id).toBe(testUserId);
    expect(user.name).toBe(MOCKED_USER.fullName);
    expect(user.email).toBe(MOCKED_USER.email);
    expect(user.telephone).toBe(MOCKED_USER.telephone); // Campos de configuração

    expect(user.password_hash).toBeUndefined();
  });

  it("2. Deve retornar 401 Unauthorized se o token de autenticação estiver ausente", async () => {
    // Tenta acessar a rota sem enviar o header 'Authorization'
    const response = await requestClient.get("/users/read_profile"); // O preHandler [app.authenticate] deve bloquear

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
