import { it, expect, beforeAll, afterAll, describe } from "vitest";
import supertest from "supertest";
import { app } from "../../app.ts";
import { vi } from "vitest";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";

vi.mock("../../utils/mail-service.ts", () => {
  return {
    sendOtpEmail: vi.fn().mockResolvedValue(undefined),
  };
});

import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { createTestUser2FA } from "../../functions/users/create-test-user-2fa-function.ts";

const MOCKED_USER_DEFAULT = {
  // Usuário para Login Direto
  email: "john.doe@gmail.com",
  password: "12345678",
  name: "John Doe",
  two_factor_enabled: false,
};

const MOCKED_USER_2FA = {
  // Usuário para Início de 2FA
  email: "2fa.user@gmail.com",
  password: "12345678",
  name: "User 2FA",
  two_factor_enabled: true,
};

let requestClient: supertest.Agent;
let testUserId: string;
let testUser2FAId: string;
describe("POST /login - Autenticação de Usuário", () => {
  // Configuração: Cria os usuários de teste ANTES de todos os testes
  beforeAll(async () => {
    await app.ready();
    requestClient = supertest(app.server);
    testUserId = (await createTestUser(MOCKED_USER_DEFAULT)).id; // Cria usuário sem 2FA
    testUser2FAId = (await createTestUser2FA(MOCKED_USER_2FA)).id; // Cria usuário com 2FA
  });

  afterAll(async () => {
    await deleteUserFunction(testUserId);
    await deleteUserFunction(testUser2FAId);
    await app.close();
  });

  // --- TESTE 1: Sucesso (2FA Desabilitado) ---
  it("1. Deve permitir o login com credenciais válidas (2FA desabilitado) e retornar token", async () => {
    const response = await requestClient.post("/login").send({
      email: MOCKED_USER_DEFAULT.email,
      password: MOCKED_USER_DEFAULT.password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessToken");

    const cookieHeader = response.headers["set-cookie"];
    expect(cookieHeader).toBeDefined();
    if (cookieHeader) {
      expect(cookieHeader[0]).toContain("refreshToken");
    }
  });

  // --- TESTE 2: Sucesso (2FA Habilitado) ---
  it("2. Deve iniciar o 2FA para um usuário com 2FA habilitado, retornando tempToken", async () => {
    const response = await requestClient.post("/login").send({
      email: MOCKED_USER_2FA.email,
      password: MOCKED_USER_2FA.password,
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("tempToken");
    expect(response.body).toHaveProperty(
      "message",
      "2fa habilitado. Código de verificação enviado para o e-mail.",
    );

    // Garante que o refresh token NÃO seja enviado
    const cookieHeader = response.headers["set-cookie"];
    expect(cookieHeader).toBeUndefined();
  });

  // --- TESTE 3: Falha (Senha Incorreta) ---
  it("3. Não deve permitir o login com senha incorreta e deve retornar 401", async () => {
    const response = await requestClient.post("/login").send({
      email: MOCKED_USER_DEFAULT.email,
      password: "senha_errada_de_teste",
    });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "A senha está incorreta!");
  });

  // --- TESTE 4: Falha (E-mail não Cadastrado) ---
  it("4. Não deve permitir o login com e-mail não cadastrado e deve retornar 404", async () => {
    const response = await requestClient.post("/login").send({
      email: "naoexiste@codicash.com",
      password: MOCKED_USER_DEFAULT.password,
    });

    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message", "O e-mail não está cadastrado!");
  });

  // --- TESTE 5: Falha (E-mail Inválido - ZodError) ---
  it("5. Não deve permitir o login se o email estiver em formato inválido e deve retornar 400", async () => {
    const response = await requestClient.post("/login").send({
      email: "email_invalido", // Zod: z.email() falha
      password: MOCKED_USER_DEFAULT.password,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Dados de entrada em formato inválido");
    expect(response.body).toHaveProperty("errors");
  });

  // --- TESTE 6: Falha (Campo Ausente - ZodError) ---
  it("6. Não deve permitir o login se o campo password estiver ausente e deve retornar 400", async () => {
    const response = await requestClient.post("/login").send({
      email: MOCKED_USER_DEFAULT.email,
      // password ausente
    });

    expect(response.statusCode).toBe(400);
    expect(response.body).toHaveProperty("message", "Dados de entrada em formato inválido");
    expect(response.body).toHaveProperty("errors");
  });
});
