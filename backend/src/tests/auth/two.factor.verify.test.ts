import { it, expect, beforeAll, afterAll, describe, vi, beforeEach } from "vitest";
import supertest from "supertest";
import { app } from "../../app.ts"; // A instância do Fastify
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts";
import { generateTwoFactorTempToken } from "../../utils/tokens-service.ts";
import { createTwoFactorRequestFunction } from "../mocks/create-two-factor-request-function.ts";
import { deleteTwoFactorRequestFunction } from "../mocks/delete-two-factor-request-function.ts";
import { generateExpiredTempTokenFunction } from "../mocks/generate-expired-temp-token-function.ts";
// Dados do Usuário Padrão para Setup
const MOCKED_USER = {
  fullName: "2FA Verify Test User",
  email: "2fa.verify.test@codicash.com",
  password: "TestPassword123",
  two_factor_enabled: true,
};

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
let tempToken: string; // Token '2fa_pending' (emitido após verificar credenciais, antes de verificar o código)
let createdCode: string;
let twoFactorRequestData: TwoFactorRequestData;
describe("POST /verify - Verificação de Código 2FA e Emissão de Tokens Finais", () => {
  beforeAll(async () => {
    await app.ready();
    requestClient = supertest(app.server); // 1. Cria o usuário de teste no banco

    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id; // 2. Simula a emissão de um token temporário '2fa_pending'
    tempToken = await generateTwoFactorTempToken(
      app,
      testUserId,
      MOCKED_USER.email,
      MOCKED_USER.fullName,
    );

    twoFactorRequestData = await createTwoFactorRequestFunction(testUserId);
    createdCode = twoFactorRequestData.code;
  });

  afterAll(async () => {
    const requestIdToDelete = twoFactorRequestData.createdTwoFactorRequest?.id;
    console.log(`[AFTERALL] Tentando deletar Two Factor Request com ID: ${requestIdToDelete}`);

    if (requestIdToDelete) {
      await deleteTwoFactorRequestFunction(requestIdToDelete);
    }
    await deleteTwoFactorRequestFunction(twoFactorRequestData.createdTwoFactorRequest.id);
    await app.close();
  });
  // --- TESTE 1: Caminho Feliz (Código Correto) ---

  it("1. Deve retornar 200, emitir tokens finais e setar o refreshToken no cookie quando o código 2FA for correto", async () => {
    // O mock deve retornar true APENAS para este teste.

    const response = await requestClient
      .post("/2fa/verify") // Token '2fa_pending' válido
      .set("Authorization", `Bearer ${tempToken}`)
      .send({
        code: createdCode,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Autenticação 2FA concluída com sucesso");
    expect(response.body).toHaveProperty("accessToken"); // 1. Verifica se a função de verificação foi chamada com os dados corretos
    expect(response.headers["set-cookie"]).toBeDefined();
    if (!response.headers["set-cookie"]) return;
    expect(response.headers["set-cookie"][0]).toContain(`refreshToken=`);
  }); // --- TESTE 2: Código Incorreto ---

  it("2. Deve retornar 401 e a mensagem 'Código incorreto!' quando o código 2FA for inválido", async () => {
    // Configura o mock para retornar falha na verificação

    const response = await requestClient
      .post("/2fa/verify")
      .set("Authorization", `Bearer ${tempToken}`)
      .send({
        code: "999999", // Código errado
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Código incorreto!"); // Garante que a emissão de tokens finais NÃO foi chamada
  }); // --- TESTE 3: Token Temporário Ausente (Auth Header) ---

  it("3. Deve retornar 401 se o cabeçalho Authorization estiver ausente", async () => {
    const response = await requestClient
      .post("/2fa/verify") // Sem .set("Authorization", ...)
      .send({
        code: createdCode,
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Auth Header ausente");
  }); // --- TESTE 4: Token Expirado (Erro FAST_JWT_EXPIRED) ---

  it("4. Deve retornar 401 e a mensagem de expiração se o tempToken estiver expirado", async () => {
    const payload = {
      id: testUserId,
      email: MOCKED_USER.email,
      name: MOCKED_USER.fullName,
    };
    const expiredTempToken = await generateExpiredTempTokenFunction(app, payload);

    const response = await requestClient
      .post("/2fa/verify")
      .set("Authorization", `Bearer ${expiredTempToken}`)
      .send({
        code: "123456",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Seu código está expirado");
  }); // --- TESTE 5: Token de Tipo Incorreto (type != "2fa_pending") ---

  it("5. Deve retornar 401 se o token não for do tipo '2fa_pending'", async () => {
    // Simula a criação de um token de acesso normal ('access')
    const wrongTypeToken = await app.jwt.sign(
      { id: testUserId, email: MOCKED_USER.email, name: MOCKED_USER.fullName, type: "access" },
      { expiresIn: "1h" },
    );

    const response = await requestClient
      .post("/2fa/verify")
      .set("Authorization", `Bearer ${wrongTypeToken}`)
      .send({
        code: "123456",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Token inválido para 2FA");
  }); // --- TESTE 6: Código Ausente no Body ---

  it("6. Deve retornar 400 se o campo 'code' estiver ausente", async () => {
    // O Fastify lida com a falta de dados no body que não se encaixam no schema
    const response = await requestClient
      .post("/2fa/verify")
      .set("Authorization", `Bearer ${tempToken}`)
      .send({}); // Body vazio, 'code' ausente

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});
