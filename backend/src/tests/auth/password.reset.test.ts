import { it, expect, beforeAll, afterAll, describe, vi, beforeEach } from "vitest";
import supertest from "supertest";
import { app } from "../../app.ts";
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts";

// Mocks para isolar o teste
import { verify2faCodeFunction } from "../../functions/auth/verify-2fa-code-function.ts";
import { updateUserPasswordFunction } from "../../functions/users/update-user-password-function.ts";
import { generateTwoFactorTempToken } from "../../utils/tokens-service.ts";
import { createTwoFactorRequestFunction } from "../mocks/create-two-factor-request-function.ts";
import { deleteTwoFactorRequestFunction } from "../mocks/delete-two-factor-request-function.ts";
import { generateExpiredTempTokenFunction } from "../mocks/generate-expired-temp-token-function.ts";

// Mocka a função que altera a senha.
const MOCKED_USER = {
  fullName: "Reset Pass Test User",
  email: "reset.pass.test@codicash.com",
  password: "OldPassword123",
  two_factor_enabled: true,
};
const NEW_PASSWORD = "NewStrongPassword456";
type TwoFactorRequestData = {
  // Propriedade 'createdTwoFactorRequest' que é um objeto
  createdTwoFactorRequest: {
    id: string;
    codeHash: string;
    expiresAt: Date;
    consumed: boolean;
    createdAt: Date;
    ip: string | null;
    userId: string;
  }; // <--- Fechamento do objeto

  // Propriedade 'code'
  code: string;
};

let requestClient: supertest.Agent;
let testUserId: string;
let tempToken: string; // Token gerado na primeira etapa (simulando /verify_email ou similar)
let expiredTempToken: string;
let twoFactorRequestData: TwoFactorRequestData;
let createdCode: string;
describe("POST /reset_password - Alteração de Senha via 2FA", () => {
  beforeAll(async () => {
    await app.ready();
    requestClient = supertest(app.server);
    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id;
    const payload = {
      id: testUserId,
      email: MOCKED_USER.email,
      name: MOCKED_USER.fullName,
    };
    tempToken = await generateTwoFactorTempToken(
      app,
      testUserId,
      MOCKED_USER.email,
      MOCKED_USER.fullName,
    );

    expiredTempToken = await generateExpiredTempTokenFunction(app, payload);

    twoFactorRequestData = await createTwoFactorRequestFunction(testUserId);
    createdCode = twoFactorRequestData.code;

    expect(tempToken).toBeDefined();
  });

  afterAll(async () => {
    await deleteUserFunction(testUserId);
    const requestIdToDelete = twoFactorRequestData.createdTwoFactorRequest?.id;
    console.log(`Tentando deletar Two Factor Request com ID: ${requestIdToDelete}`);

    if (requestIdToDelete) {
      await deleteTwoFactorRequestFunction(requestIdToDelete);
    }
    await deleteTwoFactorRequestFunction(twoFactorRequestData.createdTwoFactorRequest.id);
    await app.close();
  });

  it("1. Deve retornar 200 e alterar a senha quando o código 2FA for correto", async () => {
    // CORREÇÃO: Usa mockResolvedValueOnce para que a implementação de sucesso não vaze para o Teste 3
    const response = await requestClient
      .post("/users/reset_password")
      .set("Authorization", `Bearer ${tempToken}`)
      .send({
        code: createdCode, // Código mockado
        password: NEW_PASSWORD,
      });

    expect(response.statusCode).toBe(200);

    expect(response.body).toHaveProperty(
      "message",
      "Senha alterada com sucesso! Faça login a seguir!",
    );
    expect(response.body).toHaveProperty("changedUser"); // 1. Verifica se a função de verificação do código foi chamada corretamente
  }); // --- TESTE 2: Código Incorreto ---

  it("2. Deve retornar 401 e a mensagem 'Código incorreto!' quando o código 2FA for inválido", async () => {
    // Configura o mock para retornar falha na verificação do código

    const response = await requestClient
      .post("/users/reset_password")
      .set("Authorization", `Bearer ${tempToken}`)
      .send({
        code: "999999", // Código errado
        password: NEW_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Código incorreto!"); // Garante que a atualização de senha NÃO foi chamada
  }); // --- TESTE 3: Falha de Validação (Senha muito curta) ---

  it("3. Deve retornar 400 se a nova senha for muito curta (Zod Validation)", async () => {
    // Este teste deve falhar na validação do Zod antes de chegar ao mock de 2FA
    const response = await requestClient
      .post("/users/reset_password")
      .set("Authorization", `Bearer ${tempToken}`)
      .send({
        code: "123456",
        password: "short", // Menos de 8 caracteres
      });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
    expect(response.body).toHaveProperty("errors");
  }); // --- TESTE 4: Token Temporário Ausente ---

  it("4. Deve retornar 401 se o cabeçalho Authorization estiver ausente", async () => {
    const response = await requestClient
      .post("/users/reset_password") // Sem .set("Authorization", ...)
      .send({
        code: "123456",
        password: NEW_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Auth Header ausente");
  }); // --- TESTE 5: Token Expirado ---

  it("5. Deve retornar 401 e a mensagem de expiração se o tempToken estiver expirado", async () => {
    // Token JWT expirado (exp: 1672529660)
    const payload = {
      id: testUserId,
      email: MOCKED_USER.email,
      name: MOCKED_USER.fullName,
    };
    const expiredTempToken = await generateExpiredTempTokenFunction(app, payload);
    const response = await requestClient
      .post("/users/reset_password")
      .set("Authorization", `Bearer ${expiredTempToken}`)
      .send({
        code: "123456",
        password: NEW_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Seu código expirou. Faça login novamente.");
    expect(response.body).toHaveProperty("code", "TEMP_TOKEN_EXPIRED");
  }); // --- TESTE 6: Token de Tipo Incorreto ---

  it("6. Deve retornar 401 se o token não for do tipo '2fa_pending'", async () => {
    // Simula a criação de um token de acesso normal
    const wrongTypeToken = await app.jwt.sign(
      { id: testUserId, email: MOCKED_USER.email, name: MOCKED_USER.fullName, type: "access" },
      { expiresIn: "1h" },
    );

    const response = await requestClient
      .post("/users/reset_password")
      .set("Authorization", `Bearer ${wrongTypeToken}`)
      .send({
        code: "123456",
        password: NEW_PASSWORD,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Token inválido para 2FA");
  });
});
