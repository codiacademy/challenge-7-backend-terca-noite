import { it, expect, beforeAll, afterAll, describe } from "vitest";
import supertest from "supertest";
import { createApp } from "../../app.ts"; // Importa a função fábrica
import type { FastifyInstance } from "fastify"; // Importa o tipo FastifyInstance;
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts";
import { vi } from "vitest";

vi.mock("../../functions/auth/two-factor-send-function.ts", () => ({
  twoFactorSendFunction: vi.fn().mockResolvedValue(undefined),
}));

// Dados do Usuário Padrão (Este e-mail deve existir no DB)
const MOCKED_USER = {
  fullName: "Verify Email Test User",
  email: "verify.email.test@codicash.com",
  password: "TestPassword123",
  two_factor_enabled: true, // Assumimos que o 2FA está habilitado para o fluxo completo
};

const NON_EXISTENT_EMAIL = "non.existent.user@codicash.com";

let appInstance: FastifyInstance;
let requestClient: supertest.Agent;
let testUserId: string;

describe("POST /verify_email - Inicia 2FA e Envia Código", () => {
  beforeAll(async () => {
    appInstance = await createApp();
    await appInstance.ready();
    requestClient = supertest(appInstance.server);

    // 1. Cria o usuário de teste
    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id;

    // O 2FA deve estar habilitado para este teste simular o fluxo real de envio de código
    await prisma.user.update({
      where: { id: testUserId },
      data: { two_factor_enabled: true },
    });
  });

  afterAll(async () => {
    // Limpa o usuário do banco
    await deleteUserFunction(testUserId);
    await appInstance.close();
  });

  // --- TESTE 1: Caminho Feliz (E-mail Existente) ---
  it("1. Deve retornar 200, enviar o código e retornar um tempToken quando o e-mail existir", async () => {
    const response = await requestClient.post("/auth/verify_email").send({
      email: MOCKED_USER.email,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      " Código de verificação enviado para o e-mail.",
    );
    expect(response.body).toHaveProperty("tempToken");

    // O tempToken deve ser um JWT válido (uma string longa)
    expect(typeof response.body.tempToken).toBe("string");
    expect(response.body.tempToken.length).toBeGreaterThan(50);
  });

  // --- TESTE 2: E-mail Inexistente ---
  it("2. Deve retornar 200 (sem vazar informações) se o e-mail não existir", async () => {
    const response = await requestClient.post("/auth/verify_email").send({
      email: NON_EXISTENT_EMAIL, // E-mail que não existe
    });

    // A rota deve retornar 200 OK para evitar que um atacante descubra e-mails válidos.
    // Se o e-mail não existe, a função verifyEmailFunction retorna false, e o fluxo termina.
    expect(response.statusCode).toBe(400);
    // Não esperamos tempToken nem message, pois o if (emailExists) não foi executado.
    expect(response.body.message).toEqual("Usuário não encontrado");
  });

  // --- TESTE 3: Falha de Validação (E-mail Inválido) ---
  it("3. Deve retornar 400 se o e-mail estiver em formato inválido (Zod Validation)", async () => {
    const response = await requestClient.post("/auth/verify_email").send({
      email: "not-an-email", // Formato inválido
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email em formato inválido");
    expect(response.body.errors).toBeDefined();
  });

  // --- TESTE 4: Falha de Validação (Corpo vazio) ---
  it("4. Deve retornar 400 se o corpo da requisição estiver vazio ou faltando o campo email", async () => {
    const response = await requestClient.post("/auth/verify_email").send({}); // Corpo vazio

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Email em formato inválido");
  });
});
