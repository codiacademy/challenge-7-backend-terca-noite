import { it, expect, beforeAll, afterAll, describe } from "vitest";
import supertest from "supertest";
import { createApp } from "../../app.ts"; // Importa a função fábrica
import type { FastifyInstance } from "fastify"; // Importa o tipo FastifyInstance;
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts";

// IMPORTANTE: A função deleteDiscordUserInfosFunction NÃO está mockada
// para testar o fluxo completo da rota e a interação com o Prisma.

// Dados do Usuário Padrão
const MOCKED_USER = {
  fullName: "Discord Unlink Test User",
  email: "discord.unlink.test@codicash.com",
  password: "TestPassword123",
  two_factor_enabled: false,
};

// Dados de vínculo Discord mockados
const MOCKED_DISCORD_ID = "987654321098765432";
const MOCKED_DISCORD_NAME = "testUser#1234";

let requestClient: supertest.Agent;
let testUserId: string;
let accessToken: string;
let successfulLoginResponse: supertest.Response;
let appInstance: FastifyInstance;
describe("POST /discord/unlink - Desvinculação de conta Discord", () => {
  beforeAll(async () => {
    appInstance = await createApp();
    await appInstance.ready();
    requestClient = supertest(appInstance.server); // 1. Cria o usuário de teste

    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id; // 2. VINCULA o Discord antes de todos os testes (simula estado inicial)

    await prisma.user.update({
      where: { id: testUserId },
      data: {
        discordId: MOCKED_DISCORD_ID,
        discordName: MOCKED_DISCORD_NAME,
      },
    }); // 3. Gera um Access Token válido para a autenticação

    successfulLoginResponse = await requestClient.post("/login").send({
      email: MOCKED_USER.email,
      password: MOCKED_USER.password,
    });

    accessToken = successfulLoginResponse.body.accessToken;

    expect(successfulLoginResponse).toBeDefined();
  });

  afterAll(async () => {
    // Limpa o usuário do banco
    await deleteUserFunction(testUserId);
    await appInstance.close();
  }); // --- TESTE 1: Caminho Feliz (Desvinculação bem-sucedida) ---

  it("1. Deve retornar 200, desvincular o Discord e setar os campos para null", async () => {
    const response = await requestClient
      .post("/auth/discord/unlink")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("message", "Discord desvinculado com sucesso"); // Verifica a resposta da rota
    expect(response.body.updatedUser.discordId).toBeNull();
    expect(response.body.updatedUser.discordName).toBeNull(); // Confirma diretamente no banco de dados

    const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userInDb?.discordId).toBeNull();
    expect(userInDb?.discordName).toBeNull();
  }); // --- TESTE 2: Falha de Autenticação (Token Ausente) ---

  it("2. Deve retornar 401 se o cabeçalho Authorization estiver ausente", async () => {
    // Garante que o usuário ainda está desvinculado do teste anterior
    const response = await requestClient.post("/auth/discord/unlink");

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Token ausente");
  }); // --- TESTE 3: Desvinculação com campos já nulos (Idempotência) ---
  it("3. Deve retornar 200, mesmo se o Discord já estiver desvinculado", async () => {
    // Re-executa o teste sem re-vincular o usuário.
    // Os campos já estão nulls do Teste 1. A rota deve ser idempotente.
    const response = await requestClient
      .post("/auth/discord/unlink")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true); // Confirma que os campos continuam nulos no banco de dados
    const userInDb = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(userInDb?.discordId).toBeNull();
    expect(userInDb?.discordName).toBeNull();
  });
});
