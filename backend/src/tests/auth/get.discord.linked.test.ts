import { it, expect, beforeAll, afterAll, describe } from "vitest";
import supertest from "supertest";
import { createApp } from "../../app.ts"; // Importa a função fábrica
import type { FastifyInstance } from "fastify"; // Importa o tipo FastifyInstance;
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts";

// IMPORTANTE: A função isDiscordLinkedFunction NÃO está mockada
// para testar o fluxo completo da rota, conforme solicitado.

// Dados do Usuário Padrão
const MOCKED_USER = {
  fullName: "Discord Link Test User",
  email: "discord.link.test@codicash.com",
  password: "TestPassword123",
  two_factor_enabled: false,
};

let appInstance: FastifyInstance; // Nova variável para a instância Fastify

let requestClient: supertest.Agent;
let testUserId: string;
let accessToken: string;

describe("GET /get_discord_linked - Verifica status de link com Discord", () => {
  beforeAll(async () => {
    appInstance = await createApp();
    await appInstance.ready();
    requestClient = supertest(appInstance.server); // 1. Cria o usuário de teste (sem discordId por padrão)

    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id; // 2. Gera um Access Token válido para a autenticação

    accessToken = await appInstance.jwt.sign(
      {
        id: testUserId,
        email: MOCKED_USER.email,
        name: MOCKED_USER.fullName,
        type: "access",
      },
      { expiresIn: "1h" },
    ); // Garante que o usuário começa sem o discordId

    await prisma.user.update({
      where: { id: testUserId },
      data: { discordId: null },
    });

    expect(accessToken).toBeDefined();
  });

  afterAll(async () => {
    // Limpa o usuário do banco
    await deleteUserFunction(testUserId);
    await appInstance.close();
  }); // --- TESTE 1: Usuário NÃO vinculado (Status inicial) ---

  it("1. Deve retornar 200 e isDiscordLinked: false quando o usuário não tiver DiscordId", async () => {
    const response = await requestClient
      .get("/auth/get_discord_linked")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Informação de link com DiscordObtida");
    expect(response.body).toHaveProperty("isDiscordLinked", false);
  }); // --- TESTE 2: Usuário VINCULADO ---

  it("2. Deve retornar 200 e isDiscordLinked: true quando o usuário tiver DiscordId", async () => {
    // Ação: Simula o vínculo adicionando um discordId
    await prisma.user.update({
      where: { id: testUserId },
      data: { discordId: "123456789012345678" },
    });

    const response = await requestClient
      .get("/auth/get_discord_linked")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Informação de link com DiscordObtida");
    expect(response.body).toHaveProperty("isDiscordLinked", true);
  }); // --- TESTE 3: Falha de Autenticação (Token Ausente) ---

  it("3. Deve retornar 401 se o cabeçalho Authorization estiver ausente", async () => {
    const response = await requestClient.get("/auth/get_discord_linked"); // Sem autenticação

    expect(response.statusCode).toBe(401); // O Fastify JWT retorna uma mensagem padrão de 401/Unauthorized em caso de falha de autenticação
    expect(response.body).toHaveProperty("message", "Token ausente");
  });
});
