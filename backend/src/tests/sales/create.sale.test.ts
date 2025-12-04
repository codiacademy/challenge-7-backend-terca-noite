import { it, expect, beforeAll, afterAll, describe } from "vitest";
import { createApp } from "../../app.ts";
import type { FastifyInstance } from "fastify";
import supertest from "supertest";
import { createTestUser } from "../../functions/users/create-test-user-function.ts";
import { deleteUserFunction } from "../../functions/users/delete-user-function.ts";
import { prisma } from "../../lib/prisma.ts"; // Importar o Prisma para verificar o DB

// Variáveis globais
let appInstance: FastifyInstance;
let accessToken: string;
let testUserId: string;
let requestClient: supertest.Agent;

// Dados iniciais do usuário
const INITIAL_PASSWORD = "SaleTestPassword123";
const MOCKED_USER = {
  fullName: "Sale Creator User",
  email: "sale.creator.test@codicash.com",
  password: INITIAL_PASSWORD,
  two_factor_enabled: false,
};

// Dados de venda válidos
const VALID_SALE_DATA = {
  customer: {
    name: "Maria da Silva",
    email: "maria.silva@aluno.com.br",
    phone: "11987654321", // 11 dígitos
    cpf: "12345678901", // 11 dígitos
  },
  course: {
    type: "presencial", // Enum válido
    name: "Excel Avançado",
    price: 899.9,
  },
  discount: 89.9,
  taxes: 15.0,
  commissions: 50.0,
  cardFees: 20.0,
  finalPrice: 805.0, // 899.90 - 89.90 + 15 + 50 + 20 = 895
};

// --- Configuração E2E: Inicialização e Login ---

beforeAll(async () => {
  // 1. Inicializa o Fastify
  appInstance = await createApp();
  await appInstance.ready();
  requestClient = supertest(appInstance.server);

  // 2. CRIAÇÃO DO USUÁRIO DE TESTE
  const user = await createTestUser(MOCKED_USER);
  testUserId = user.id;

  // 3. LOGIN inicial para obter o Access Token
  const loginResponse = await requestClient.post("/login").send({
    email: MOCKED_USER.email,
    password: INITIAL_PASSWORD,
  });

  expect(loginResponse.statusCode).toBe(200);
  accessToken = loginResponse.body.accessToken;
  expect(accessToken).toBeDefined();
});

afterAll(async () => {
  // Limpeza do usuário do banco
  await deleteUserFunction(testUserId);
  await appInstance.close();
});

// --- Testes da Rota POST /create_sale ---

describe("POST /create_sale - Criação de Venda", () => {
  it("1. Deve criar uma venda com sucesso e retornar status 201", async () => {
    // 1. Executa a requisição POST para criar a venda
    const response = await requestClient
      .post("/sales/create_sale")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send(VALID_SALE_DATA);

    // 2. Verificação da Resposta (201 Created)
    expect(response.statusCode).toBe(201);
    expect(response.body.message).toBe("Venda criada com sucesso");
    expect(response.body.createdSale).toBeDefined();

    const createdSale = response.body.createdSale;
    // 3. Verifica alguns campos essenciais da venda criada
    expect(createdSale).toHaveProperty("client_name", VALID_SALE_DATA.customer.name);
    expect(createdSale).toHaveProperty("course", VALID_SALE_DATA.course.name);
    expect(createdSale).toHaveProperty("total_value", String(VALID_SALE_DATA.finalPrice));
    expect(createdSale).toHaveProperty("created_by", testUserId);

    // 4. Verifica no DB se a venda foi persistida corretamente (opcional, mas recomendado)
    const saleInDb = await prisma.sale.findUnique({ where: { id: createdSale.id } });
    expect(saleInDb).not.toBeNull();
    expect(saleInDb!.client_email).toBe(VALID_SALE_DATA.customer.email);
    expect(saleInDb!.course_type).toBe(VALID_SALE_DATA.course.type); // Prisma armazena enum em uppercase
  });

  it("2. Deve retornar 400 Bad Request para dados de cliente inválidos (ex: email)", async () => {
    // Prepara dados com email inválido
    const invalidData = {
      ...VALID_SALE_DATA,
      customer: {
        ...VALID_SALE_DATA.customer,
        email: "email-invalido-sem-arroba",
      },
    };

    // 1. Executa a requisição POST
    const response = await requestClient
      .post("/sales/create_sale")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send(invalidData);

    // 2. Verificação da Resposta (400 Bad Request)
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Dados de entrada em formato inválido");
    // 3. Verifica se os erros Zod estão presentes
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].path).toEqual(["customer", "email"]);
  });

  it("3. Deve retornar 400 Bad Request para tipo de curso inválido (enum)", async () => {
    // Prepara dados com tipo de curso inválido
    const invalidData = {
      ...VALID_SALE_DATA,
      course: {
        ...VALID_SALE_DATA.course,
        type: "hibrido", // Tipo que não existe no enum (presencial, online)
      },
    };

    // 1. Executa a requisição POST
    const response = await requestClient
      .post("/sales/create_sale")
      .set({
        authorization: `Bearer ${accessToken}`,
      })
      .send(invalidData);

    // 2. Verificação da Resposta (400 Bad Request)
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Dados de entrada em formato inválido");
    // 3. Verifica se os erros Zod estão presentes
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors).toHaveLength(1);
    expect(response.body.errors[0].path).toEqual(["course", "type"]);
  });

  it("4. Deve retornar 401 Unauthorized se o token de autenticação estiver ausente", async () => {
    // Tenta acessar a rota sem enviar o header 'Authorization'
    const response = await requestClient.post("/sales/create_sale").send(VALID_SALE_DATA);

    // O preHandler [app.authenticate] deve bloquear
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
