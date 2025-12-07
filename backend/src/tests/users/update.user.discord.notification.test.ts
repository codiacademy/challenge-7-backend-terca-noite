import { it, expect, beforeAll, afterAll, describe, vi } from "vitest";
import { createApp } from "../../app.ts";
import { prisma } from "../../lib/prisma.ts";
import type { FastifyInstance } from "fastify";
import supertest from "supertest";
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";

// IMPORTAÇÃO DA FUNÇÃO A SER MOCKADA E ESPIONADA
import * as notifications from "../../functions/notifications/send-discord-notification-to-user-function.ts";

// Variáveis globais para a instância da aplicação, token e ID do usuário de teste
let appInstance: FastifyInstance;
let accessToken: string;
let testUserId: string;
let requestClient: supertest.Agent;

// MOCK: Substitui a função real por um mock
const sendDiscordNotificationMock = vi
  .spyOn(notifications, "sendDiscordNotificationToUserFunction")
  .mockImplementation(async (userId: string) => {
    console.log(`[MOCK] Notificação Discord SIMULADA enviada para o User ID: ${userId}`);
    return Promise.resolve(true); // Simula o sucesso
  });

// Dados do usuário mockado
const MOCKED_USER = {
  fullName: "Discord Notification Test User",
  email: "discord.notify.test@codicash.com",
  password: "CorrectPassword123",
  two_factor_enabled: false,
};

// --- Configuração E2E: Inicialização e Login ---

beforeAll(async () => {
  // 1. Inicializa o Fastify
  appInstance = await createApp();
  await appInstance.ready();
  requestClient = supertest(appInstance.server); // 2. CRIAÇÃO DO USUÁRIO DE TESTE (Garantindo que o estado inicial seja FALSE)

  const user = await createTestUser({
    ...MOCKED_USER,
  });
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
  // Limpeza do usuário do banco e restauração do mock
  await deleteUserFunction(testUserId);
  sendDiscordNotificationMock.mockRestore(); // Restaura a função original
  await appInstance.close();
});

// --- Testes da Rota /update_discord_notification ---

describe("PATCH /update_discord_notification - Atualização de Notificações Discord", () => {
  it("1. Deve mudar o status de FALSE para TRUE e chamar a função de notificação", async () => {
    // 1. Garante que o estado inicial é FALSE
    let dbUser = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { notification_discord_enabled: true },
    });
    expect(dbUser?.notification_discord_enabled).toBe(false); // 2. Executa a requisição PATCH (deve ir para TRUE)

    const response = await requestClient.patch("/users/update_discord_notification").set({
      authorization: `Bearer ${accessToken}`,
    }); // 3. Verificação da Resposta (200 OK)

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Notificações por discord atualizadas com sucesso");
    expect(response.body.user.discordNotificationEnabled).toBe(true); // 4. Verificação no Banco de Dados (Confirma o toggle)

    dbUser = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { notification_discord_enabled: true },
    });
    expect(dbUser?.notification_discord_enabled).toBe(true); // 5. Verificação do MOCK (Garante que a notificação foi tentada)

    expect(sendDiscordNotificationMock).toHaveBeenCalledTimes(1);
    expect(sendDiscordNotificationMock).toHaveBeenCalledWith(testUserId);
  });

  it("2. Deve mudar o status de TRUE de volta para FALSE na segunda chamada", async () => {
    // O estado atual é TRUE (herdado do teste anterior)

    // 1. Executa a segunda requisição PATCH (deve ir para FALSE)
    const response = await requestClient.patch("/users/update_discord_notification").set({
      authorization: `Bearer ${accessToken}`,
    }); // 2. Verificação da Resposta (200 OK)

    expect(response.statusCode).toBe(200);
    expect(response.body.user.discordNotificationEnabled).toBe(false); // 3. Verificação no Banco de Dados (Confirma o toggle)

    const dbUser = await prisma.user.findUnique({
      where: { id: testUserId },
      select: { notification_discord_enabled: true },
    });
    expect(dbUser?.notification_discord_enabled).toBe(false); // 4. Verificação do MOCK: Chamado pela segunda vez

    expect(sendDiscordNotificationMock).toHaveBeenCalledTimes(2);
    expect(sendDiscordNotificationMock).toHaveBeenLastCalledWith(testUserId);
  });

  it("3. Deve retornar 401 Unauthorized se o token de autenticação estiver ausente", async () => {
    // Tenta acessar a rota sem enviar o header 'Authorization'
    const response = await requestClient.patch("/users/update_discord_notification"); // O preHandler [app.authenticate] deve bloquear

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
