import { it, expect, beforeAll, afterAll, describe } from "vitest";
import supertest from "supertest";
import { app } from "../../app.ts"; // A instância do Fastify
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts";

// Dados do Usuário Padrão
const MOCKED_USER = {
  fullName: "Verify Pass Test User",
  email: "verify.pass@codicash.com",
  password: "CorrectPassword123",
  two_factor_enabled: false,
};

let requestClient: supertest.Agent;
let testUserId: string;
let accessToken: string;

describe("POST /verify_password - Verificação de Senha de Usuário Autenticado", () => {
  beforeAll(async () => {
    await app.ready();
    requestClient = supertest(app.server);

    // 1. Cria o usuário de teste
    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id;

    // 2. Realiza o login para obter o Access Token (necessário para o preHandler: [app.authenticate])
    const loginResponse = await requestClient.post("/login").send({
      email: MOCKED_USER.email,
      password: MOCKED_USER.password,
    });

    // Assume que o accessToken é retornado no corpo da resposta
    accessToken = loginResponse.body.accessToken;

    // Garante que o token foi obtido
    expect(accessToken).toBeDefined();
  });

  afterAll(async () => {
    // Limpa o usuário do banco
    await deleteUserFunction(testUserId);
    await app.close();
  });

  // --- TESTE 1: Caminho Feliz (Senha Correta) ---
  it("1. Deve retornar isPasswordCorrect: true quando a senha fornecida estiver correta", async () => {
    const response = await requestClient
      .post("/auth/verify_password")
      // Inclui o Access Token no header de Authorization
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        password: MOCKED_USER.password, // Senha correta
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Verificação de senha realizada com sucesso");
    expect(response.body).toHaveProperty("isPasswordCorrect", true);
  });

  // --- TESTE 2: Senha Incorreta ---
  it("2. Deve retornar isPasswordCorrect: false quando a senha fornecida estiver incorreta", async () => {
    const response = await requestClient
      .post("/auth/verify_password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        password: "WrongPassword123", // Senha incorreta
      });

    expect(response.statusCode).toBe(200); // Rota deve retornar 200, mas com a flag false
    expect(response.body).toHaveProperty("message", "Verificação de senha realizada com sucesso");
    expect(response.body).toHaveProperty("isPasswordCorrect", false);
  });

  // --- TESTE 3: Falha de Validação (Senha muito curta) ---
  it("3. Deve retornar 400 se a senha for muito curta (Zod Validation)", async () => {
    const response = await requestClient
      .post("/auth/verify_password")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        password: "short", // Menos de 8 caracteres
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("ID em formato inválidos"); // Mensagem padrão do Zod
    expect(response.body.errors).toBeDefined();
  });

  // --- TESTE 4: Falha de Autenticação (Token Ausente) ---
  it("4. Deve retornar 401 se o Authorization Token estiver ausente", async () => {
    const response = await requestClient
      .post("/auth/verify_password")
      // Sem .set("Authorization", ...)
      .send({
        password: MOCKED_USER.password,
      });

    // O preHandler [app.authenticate] deve rejeitar a requisição
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  // --- TESTE 5: Falha de Autenticação (Token Inválido/Expirado) ---
  it("5. Deve retornar 401 se o Authorization Token for inválido ou expirado", async () => {
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImVtYWlsIjoiZXhwaXJlZUBleGFtcGxlLmNvbSIsIm5hbWUiOiJFeHBpcmVkIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTY3MjUyOTYwMCwiZXhwIjoxNjcyNTI5NjYwfQ.s_T_bH4eO0jF_VwJ1H7Jb1qW3jE3wN7dY6gZ4gK2D3Y";

    const response = await requestClient
      .post("/auth/verify_password")
      .set("Authorization", `Bearer ${expiredToken}`)
      .send({
        password: MOCKED_USER.password,
      });

    // O preHandler [app.authenticate] deve rejeitar a requisição
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
