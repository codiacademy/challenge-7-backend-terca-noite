import { it, expect, beforeAll, afterAll, describe, vi } from "vitest";
import { prisma } from "../../lib/prisma.ts";
import supertest from "supertest";
import { createApp } from "../../app.ts";
import type { FastifyInstance } from "fastify";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { beforeEach } from "node:test";

// ----------------------------------------------------
// CONFIGURAÇÃO DE AMBIENTE E INSTÂNCIA
// ----------------------------------------------------

// Mock das variáveis de ambiente necessárias para a inicialização Fastify,
// especialmente aquelas que não são mockadas em outros lugares, mas podem ser
// usadas em plugins globais (como JWT_SECRET).
vi.stubEnv("JWT_SECRET", "mock-secret-for-tests");
vi.stubEnv("JWT_REFRESH_SECRET", "mock-refresh-secret-for-tests");
vi.stubEnv("JWT_EXPIRES_IN", "1m");
vi.stubEnv("JWT_REFRESH_EXPIRES_IN", "7d");

let appInstance: FastifyInstance;
let requestClient: supertest.Agent;
// Armazenamento de IDs de usuários criados para limp eza
const usersToCleanup: string[] = [];

const STATIC_CLEANUP_EMAILS = [
  "alice@example.com",
  "teste.tel@codicash.com",
  "alice@example.com",
  "teste.create@codicash.com",
  "bob@example.com",
  "charlie@example.com",
];
// Dados básicos de usuário para testes
const BASE_USER_DATA = {
  fullName: "Novo Usuário Teste",
  email: "teste.create@codicash.com",
  password: "Password123",
};

async function cleanupStaticUserByEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // Usa a função de delete existente
      await deleteUserFunction(user.id);
      console.log(`[CLEANUP] Usuário ${email} deletado com sucesso.`);
    }
  } catch (e) {
    // Apenas ignora erros de limpeza se o usuário já não existir
    // O teste continuará se o usuário não for encontrado.
    console.warn(`[CLEANUP] Falha ao limpar o usuário ${email}. Ignorando.`);
  }
}

describe("POST /create_user - Criação de Novo Usuário", () => {
  beforeAll(async () => {
    // Inicializa a aplicação Fastify de forma robusta
    await Promise.all(STATIC_CLEANUP_EMAILS.map((email) => cleanupStaticUserByEmail(email)));

    appInstance = await createApp();
    await appInstance.ready();
    requestClient = supertest(appInstance.server);
  });

  afterAll(async () => {
    // Limpa todos os usuários criados durante os testes
    await Promise.all(STATIC_CLEANUP_EMAILS.map((email) => cleanupStaticUserByEmail(email)));
    // Fecha a instância Fastify
    await appInstance.close();
  });

  // ----------------------------------------------------
  // TESTE 1: Caminho Feliz - Criação de Usuário
  // ----------------------------------------------------
  it("1. Deve retornar 201 e criar um novo usuário com sucesso (dados mínimos)", async () => {
    const newUser = {
      fullName: "Alice Wonderland",
      email: "alice@example.com",
      password: "securePassword123",
    };

    const response = await requestClient.post("/users/create_user").send(newUser).expect(201);

    expect(response.body).toHaveProperty("message", "Usuário criado com sucesso");
    expect(response.body).toHaveProperty("user");

    const user = response.body.user;
    expect(user).toHaveProperty("id");
    expect(typeof user.id).toBe("string");
    expect(user.name).toBe(newUser.fullName);
    expect(user.email).toBe(newUser.email);

    // Deve retornar apenas os campos públicos (sem a senha/hash)
    expect(user).not.toHaveProperty("password");
    expect(user).not.toHaveProperty("passwordHash");

    // Armazena o ID para limpeza no afterAll
    usersToCleanup.push(user.id);
  });

  // ----------------------------------------------------
  // TESTE 2: Criação de Usuário com Dados Opcionais (Telephone)
  // ----------------------------------------------------
  it("2. Deve retornar 201 e criar um novo usuário com sucesso (incluindo telephone)", async () => {
    const newUserWithTel = {
      ...BASE_USER_DATA,
      email: "teste.tel@codicash.com", // Novo email para não conflitar
      telephone: "+5511987654321",
    };

    const response = await requestClient
      .post("/users/create_user")
      .send(newUserWithTel)
      .expect(201);

    const user = response.body.user;
    expect(user.email).toBe(newUserWithTel.email);
    expect(user).toHaveProperty("telephone", newUserWithTel.telephone);

    usersToCleanup.push(user.id);
  });

  // ----------------------------------------------------
  // TESTE 3: Falha de Conflito (Email já cadastrado)
  // ----------------------------------------------------
  it("3. Deve retornar 409 (Conflict) se o email já estiver em uso", async () => {
    const creationResponse = await requestClient
      .post("/users/create_user")
      .send(BASE_USER_DATA)
      .expect(201);
    // 2. Tenta criar outro usuário com o mesmo email
    // 1. Cria um usuário que será o conflito
    const conflictUser = { ...BASE_USER_DATA, name: "Novo Usuário Teste 2" };
    const creationConflictResponse = await requestClient
      .post("/users/create_user")
      .send(conflictUser)
      .expect(409);
    // 2. Tenta criar outro usuário com o mesmo email

    expect(creationConflictResponse.body).toHaveProperty(
      "message",
      "Este e-mail já está cadastrado",
    );
    expect(creationConflictResponse.body).toHaveProperty("code", 409);
  });

  // ----------------------------------------------------
  // TESTE 4: Falha de Validação Zod (Email Inválido)
  // ----------------------------------------------------
  it("4. Deve retornar 400 (Bad Request) com erro do Zod para nome muito curto", async () => {
    const invalidUser = {
      fullName: "B", // MENOS de 3 caracteres (regra Zod)
      email: "bob@example.com", // Email válido para que o Fastify/Ajv não intercepte
      password: "Password123",
    };

    const response = await requestClient.post("/users/create_user").send(invalidUser).expect(400);

    // Deve retornar a mensagem do Zod Handler
    expect(response.body).toHaveProperty("message", "Dados de entrada em formato inválido");
    expect(response.body).toHaveProperty("errors");
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].message).toContain("O nome deve ter pelo menos 3 caracteres");
    expect(response.body.errors[0].path).toEqual(["fullName"]);
  });

  // ----------------------------------------------------
  // TESTE 5: Falha de Validação Zod (Senha Curta)
  // ----------------------------------------------------
  it("5. Deve retornar 400 com erro do Zod para senha muito curta", async () => {
    const invalidUser = {
      fullName: "Charlie",
      email: "charlie@example.com",
      password: "short", // Menos de 8 caracteres
    };

    const response = await requestClient.post("/users/create_user").send(invalidUser).expect(400);

    expect(response.body).toHaveProperty("message", "Dados de entrada em formato inválido");
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].message).toContain("A senha deve ter pelo menos 8 caracteres");
    expect(response.body.errors[0].path).toEqual(["password"]);
  });
});
