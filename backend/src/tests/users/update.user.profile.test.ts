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

// Dados iniciais e novos para o teste
const INITIAL_PASSWORD = "InitialPassword123";
const MOCKED_USER = {
  fullName: "Initial Profile User",
  email: "initial.profile.test@codicash.com",
  password: INITIAL_PASSWORD,
  telephone: "+5511987654321",
};

const NEW_FULLNAME = "Updated Profile Name";
const NEW_EMAIL = "new.updated.email@codicash.com";
const NEW_TELEPHONE = "+5521912345678";

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
});

afterAll(async () => {
  // Limpeza do usuário do banco
  await deleteUserFunction(testUserId);
  await appInstance.close();
});

// --- Testes da Rota PATCH /update_profile ---

describe("PATCH /update_profile - Atualização do Perfil do Usuário", () => {
  it("1. Deve atualizar APENAS o fullName com sucesso e retornar status 200", async () => {
    // 1. Executa a requisição PATCH para atualizar o fullName
    const response = await requestClient
      .patch("/users/update_profile")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send({
        fullName: NEW_FULLNAME,
        // Não envia 'email' nem 'telephone'
      });

    // 2. Verificação da Resposta (200 OK)
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Perfil do usuário atualizado com sucesso");
    expect(response.body.user).toHaveProperty("name", NEW_FULLNAME);
    // Verifica se os outros campos não foram alterados
    expect(response.body.user).toHaveProperty("email", MOCKED_USER.email);
    expect(response.body.user).toHaveProperty("telephone", MOCKED_USER.telephone);

    // 3. Verifica no DB se a alteração foi persistida
    const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userInDb!.name).toBe(NEW_FULLNAME);
  });

  it("2. Deve atualizar MÚLTIPLOS campos (email, telephone e nome) com sucesso e retornar status 200", async () => {
    // 1. Executa a requisição PATCH para atualizar email e telephone
    const response = await requestClient
      .patch("/users/update_profile")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send({
        email: NEW_EMAIL,
        telephone: NEW_TELEPHONE,
        fullName: NEW_FULLNAME,
      });

    // 2. Verificação da Resposta (200 OK)
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Perfil do usuário atualizado com sucesso");
    expect(response.body.user).toHaveProperty("email", NEW_EMAIL);
    expect(response.body.user).toHaveProperty("telephone", NEW_TELEPHONE);
    // Verifica se o 'fullName' anterior (atualizado no Teste 1) não foi alterado
    expect(response.body.user).toHaveProperty("name", NEW_FULLNAME);

    // 3. Verifica no DB se as alterações foram persistidas
    const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userInDb!.email).toBe(NEW_EMAIL);
    expect(userInDb!.telephone).toBe(NEW_TELEPHONE);
  });

  it("3. Deve retornar 400 Bad Request para email em formato inválido (Zod Validation)", async () => {
    // 1. Executa a requisição PATCH com email inválido
    const response = await requestClient
      .patch("/users/update_profile")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send({
        email: "email-invalido",
      });

    // 2. Verificação da Resposta (400 Bad Request)
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("ID em formato inválidos"); // Mensagem padrão para ZodError
    expect(response.body).toHaveProperty("errors");
  });

  it("4. Deve retornar 400 Bad Request para telephone em formato inválido (Zod Validation)", async () => {
    // 1. Executa a requisição PATCH com telefone inválido
    const response = await requestClient
      .patch("/users/update_profile")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send({
        telephone: "12345", // Muito curto
      });

    // 2. Verificação da Resposta (400 Bad Request)
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("ID em formato inválidos");
    expect(response.body).toHaveProperty("errors");
  });

  it("5. Deve retornar 401 Unauthorized se o token de autenticação estiver ausente", async () => {
    // Tenta acessar a rota sem enviar o header 'Authorization'
    const response = await requestClient.patch("/users/update_profile").send({
      fullName: "No Auth Test",
    }); // O preHandler [app.authenticate] deve bloquear

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
