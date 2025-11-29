import { it, expect, beforeAll, afterAll, describe, vi, beforeEach } from "vitest";
import supertest from "supertest";
import { app } from "../../app.ts";
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { generateTwoFactorTempToken } from "../../utils/tokens-service.ts";
import { AppError } from "../../utils/app-error.ts";

var twoFactorSendFunctionMock = vi.fn();
vi.mock("../../functions/auth/two-factor-send-function.ts", () => ({
  twoFactorSendFunction: twoFactorSendFunctionMock,
}));

const MOCKED_USER = {
  fullName: "Resend 2FA Test User",
  email: "resend.2fa.test@codicash.com",
  password: "TestPassword123",
  two_factor_enabled: true,
};

let requestClient: supertest.Agent;
let testUserId: string;
let originalTempToken: string;

describe("POST /resend_two_factor - Reenvio do Código de Verificação 2FA", () => {
  beforeAll(async () => {
    await app.ready();
    requestClient = supertest(app.server);

    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id;

    originalTempToken = await generateTwoFactorTempToken(
      app,
      testUserId,
      MOCKED_USER.email,
      MOCKED_USER.fullName,
    );

    expect(originalTempToken).toBeDefined();
  });

  afterAll(async () => {
    // Limpa o usuário do banco
    await deleteUserFunction(testUserId);
    await app.close();
  });

  beforeEach(() => {
    // Limpa as chamadas e garante que o mock está configurado para sucesso por padrão
    twoFactorSendFunctionMock.mockClear();
    twoFactorSendFunctionMock.mockResolvedValue({ id: "mocked-two-factor-id" });
    console.log("Mock is active? Calls before test:", twoFactorSendFunctionMock.mock.calls.length);
  });

  it("1. Deve retornar 200, chamar a função de envio de código e retornar um novo tempToken", async () => {
    // Configura o mock da geração do token para retornar o valor esperado

    const response = await requestClient
      .post("/2fa/resend_two_factor")
      .set("Authorization", `Bearer ${originalTempToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty(
      "message",
      " Código de verificação enviado para o e-mail.",
    );
    expect(response.body).toHaveProperty("tempToken");
    expect(response.body.tempToken).not.toBe(originalTempToken);
    expect(twoFactorSendFunctionMock).toHaveBeenCalledWith(testUserId);
    console.log("Mock was called. Calls after test:", twoFactorSendFunctionMock.mock.calls.length);
  });

  it("2. Deve retornar 401 se o cabeçalho Authorization estiver ausente", async () => {
    const response = await requestClient.post("/2fa/resend_two_factor"); // Sem .set("Authorization", ...)
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Auth Header ausente");
  }); // --- TESTE 3: Token Expirado ---

  it("3. Deve retornar 401 e a mensagem de expiração se o tempToken estiver expirado", async () => {
    // Token JWT expirado (exp: 1672529660, no passado)
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImVtYWlsIjoiZXhwaXJlZUBleGFtcGxlLmNvbSIsIm5hbWUiOiJFeHBpcmVkIiwidHlwZSI6IjJmYV9wZW5kaW5nIiwiaWF0IjoxNjcyNTI5NjAwLCJleHAiOjE2NzI1Mjk2NjB9.t0h3qF-Z1kY8gB7C6w-e4L5sU7XmH9R0VwX4X5k8Q_g";

    const response = await requestClient
      .post("/2fa/resend_two_factor")
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Seu código expirou. Faça login novamente.");
    expect(response.body).toHaveProperty("code", "TEMP_TOKEN_EXPIRED");
  }); // --- TESTE 4: Token de Tipo Incorreto ---

  it("4. Deve retornar 401 se o token não for do tipo '2fa_pending'", async () => {
    // Simula a criação de um token de acesso normal ('access')
    const wrongTypeToken = await app.jwt.sign(
      { id: testUserId, email: MOCKED_USER.email, name: MOCKED_USER.fullName, type: "access" },
      { expiresIn: "1h" },
    );

    const response = await requestClient
      .post("/2fa/resend_two_factor")
      .set("Authorization", `Bearer ${wrongTypeToken}`);

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Token inválido para 2FA");
  }); // --- TESTE 5: Falha na Função de Envio (twoFactorSendFunction) ---

  it("5. Deve retornar o status do AppError se houver falha no envio do código 2FA", async () => {
    // Configura o mock para lançar um erro específico

    const response = await requestClient
      .post("/2fa/resend_two_factor")
      .set("Authorization", `Bearer ${originalTempToken}`);

    expect(response.statusCode).toBe(503);
    expect(response.body).toHaveProperty("message", "Erro na integração de e-mail"); // Garante que a função foi chamada antes de falhar
    expect(twoFactorSendFunctionMock).toHaveBeenCalledWith(testUserId);
    console.log("Mock was called. Calls after test:", twoFactorSendFunctionMock.mock.calls.length);
  });
});
