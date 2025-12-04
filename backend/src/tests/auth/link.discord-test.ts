import { it, expect, beforeAll, afterAll, describe, vi, beforeEach } from "vitest";
import supertest from "supertest";
import { createApp } from "../../app.ts"; // Importa a função fábrica
import type { FastifyInstance } from "fastify"; // Importa o tipo FastifyInstance;
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";

// ----------------------------------------------------
// CONFIGURAÇÕES E MOCKS DE VARIÁVEIS DE AMBIENTE
// ----------------------------------------------------

// Mocks das variáveis de ambiente usadas nas funções injetoras
const MOCKED_GUILD_ID = "1234567890123456789";
const MOCKED_PERMISSIONS_INT = "8";
vi.stubEnv("DISCORD_TARGET_GUILD_ID", MOCKED_GUILD_ID);
vi.stubEnv("BOT_REQUIRED_PERMISSIONS_INT", MOCKED_PERMISSIONS_INT);

// ----------------------------------------------------
// MOCKS DE FUNÇÕES DE DOMÍNIO E FASTIFY OAUTH2
// ----------------------------------------------------

vi.stubEnv("DISCORD_CLIENT_ID", "mock-discord-client-id");
vi.stubEnv("DISCORD_CLIENT_SECRET", "mock-discord-client-secret");

const MOCKED_STATE_VALUE = "unique-state-for-test";
const MOCKED_AUTH_STATE_OBJ = {
  id: "mock-id-auth-state",
  userId: "mock-user-id",
  state: MOCKED_STATE_VALUE,
  expiresAt: new Date(Date.now() + 600000),
};

// MOCK 1: createAuthStateFunction
var createAuthStateFunctionMock = vi.fn();
vi.mock("../../functions/auth/create-auth-state-function.ts", () => ({
  createAuthStateFunction: createAuthStateFunctionMock,
}));

// MOCK 2: app.oauth2DiscordOAuth2 (Simula o plugin Fastify OAuth2)
const MOCKED_DISCORD_URI_BASE =
  "https://discord.com/oauth2/authorize?response_type=code&client_id=123&scope=identify&redirect_uri=http%3A%2F%2Fexample.com%2Fcallback";
const oauth2DiscordOAuth2Mock = {
  generateAuthorizationUri: vi.fn(),
};

// ----------------------------------------------------
// TESTE DA ROTA
// ----------------------------------------------------

const MOCKED_USER = {
  fullName: "Discord Link Test User",
  email: "discord.link.test@codicash.com",
  password: "TestPassword123",
  two_factor_enabled: false,
};

let requestClient: supertest.Agent;
let testUserId: string;
let accessToken: string;
let successfulLoginResponse: supertest.Response;
let appInstance: FastifyInstance;
describe("GET /discord/link - Geração de URL de Link Discord", () => {
  beforeAll(async () => {
    appInstance = await createApp();
    await appInstance.ready();
    requestClient = supertest(appInstance.server); // 1. Cria o usuário de teste

    const user = await createTestUser(MOCKED_USER);
    testUserId = user.id; // 2. Gera um Access Token válido para a autenticação

    successfulLoginResponse = await requestClient.post("/login").send({
      email: MOCKED_USER.email,
      password: MOCKED_USER.password,
    });

    accessToken = successfulLoginResponse.body.accessToken;

    expect(successfulLoginResponse).toBeDefined();

    (appInstance as any).oauth2DiscordOAuth2 = oauth2DiscordOAuth2Mock;

    expect(accessToken).toBeDefined();
  });

  afterAll(async () => {
    // Limpa o usuário do banco
    await deleteUserFunction(testUserId);
    await appInstance.close();
  });

  beforeEach(() => {
    // Limpa os mocks antes de cada teste
    createAuthStateFunctionMock.mockClear();
    oauth2DiscordOAuth2Mock.generateAuthorizationUri.mockClear(); // Configura o mock do createAuthStateFunction para o sucesso padrão

    createAuthStateFunctionMock.mockResolvedValue(MOCKED_AUTH_STATE_OBJ); // Configura o mock do generateAuthorizationUri para o sucesso padrão

    oauth2DiscordOAuth2Mock.generateAuthorizationUri.mockImplementation(
      (request, reply, callback) => {
        callback(null, MOCKED_DISCORD_URI_BASE);
      },
    );
  }); // --- TESTE 1: Caminho Feliz ---

  it("1. Deve retornar 200 com a URL de autorização do Discord corretamente montada", async () => {
    const response = await requestClient
      .get("auth/discord/link")
      .set("Authorization", `Bearer ${accessToken}`); // A URL final deve conter: MOCKED_DISCORD_URI_BASE + state + guild params

    const expectedUrl = `${MOCKED_DISCORD_URI_BASE}&state=${MOCKED_STATE_VALUE}&guild_id=${MOCKED_GUILD_ID}&disable_guild_select=true&permissions=${MOCKED_PERMISSIONS_INT}`;

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message", "Url Recebida");
    expect(response.body).toHaveProperty("authDiscordURL", expectedUrl); // Verifica se as funções foram chamadas

    expect(createAuthStateFunctionMock).toHaveBeenCalledWith(testUserId, expect.any(Date));
    expect(oauth2DiscordOAuth2Mock.generateAuthorizationUri).toHaveBeenCalled();
  }); // --- TESTE 2: Falha de Autenticação (Token Ausente) ---

  it("2. Deve retornar 401 se o cabeçalho Authorization estiver ausente", async () => {
    const response = await requestClient.get("auth/discord/link"); // Sem autenticação

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message", "Unauthorized"); // Nenhuma função deve ser chamada
    expect(createAuthStateFunctionMock).not.toHaveBeenCalled();
  }); // --- TESTE 3: Falha ao Criar Auth State ---
  it("3. Deve retornar 500 se houver falha na criação do Auth State", async () => {
    // Simula a função de domínio lançando um erro antes de gerar a URI
    createAuthStateFunctionMock.mockRejectedValueOnce(new Error("Database error"));

    const response = await requestClient
      .get("auth/discord/link")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error", "Falha ao gerar link"); // A geração da URI NÃO deve ser chamada
    expect(oauth2DiscordOAuth2Mock.generateAuthorizationUri).not.toHaveBeenCalled();
  }); // --- TESTE 4: Falha ao Gerar URI do Discord ---

  it("4. Deve retornar 500 se a geração da URI do Discord falhar", async () => {
    // Simula o callback do Fastify OAuth2 retornando um erro
    oauth2DiscordOAuth2Mock.generateAuthorizationUri.mockImplementation(
      (request, reply, callback) => {
        callback(new Error("Discord API connection failed"), null as any); // Simula falha
      },
    );

    const response = await requestClient
      .get("auth/discord/link")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("error", "Falha ao gerar URL de autorização."); // A função de estado DEVE ter sido chamada (ocorre antes)
    expect(createAuthStateFunctionMock).toHaveBeenCalled();
  });

  it("5. Deve retornar 500 se o plugin de autenticação do Discord não estiver anexado (app.oauth2DiscordOAuth2 === undefined)", async () => {
    // Remove o mock do plugin para simular o cenário de erro
    // Salva a referência original para restauração
    const originalOauth2DiscordOAuth2 = (appInstance as any).oauth2DiscordOAuth2;
    (appInstance as any).oauth2DiscordOAuth2 = undefined;

    const response = await requestClient
      .get("auth/discord/link")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message", "Erro ao fazer link com Discord"); // Restaura o mock imediatamente
    (appInstance as any).oauth2DiscordOAuth2 = originalOauth2DiscordOAuth2; // A função de estado NÃO deve ser chamada
    expect(createAuthStateFunctionMock).not.toHaveBeenCalled();
    expect(oauth2DiscordOAuth2Mock.generateAuthorizationUri).not.toHaveBeenCalled();
  });
});
