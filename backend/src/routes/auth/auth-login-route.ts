import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { authLoginFunction } from "../../functions/auth/auth-login-function";
import { z } from "zod";
import { twoFactorSendFunction } from "../../functions/auth/two-factor-send-function";
import { generateTwoFactorTempToken } from "../../utils/tokens-service";

// --- 1. ESQUEMA DO CORPO DA REQUISIÇÃO (BODY) ---
const authLoginBodySchemaDoc = {
  type: "object",
  properties: {
    email: {
      type: "string",
      description: "Email do usuário.",
    },
    password: {
      type: "string",
      description: "Senha do usuário.",
    },
  },
};

// --- 2. RESPOSTA 200: SUCESSO SEM 2FA (Tokens) ---
const loginSuccessResponseDoc = {
  type: "object",
  description: "Login bem-sucedido sem 2FA.",
  properties: {
    message: { type: "string", example: "Login bem-sucedido" },
    accessToken: {
      type: "string",
      description: "Token de acesso JWT para autenticar requisições futuras.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  },
  required: ["message", "accessToken"],
};

// --- 3. RESPOSTA 200: 2FA HABILITADO (Token Temporário) ---
const twoFactorRequiredResponseDoc = {
  type: "object",
  description: "2FA habilitado. Aguardando código de verificação.",
  properties: {
    message: {
      type: "string",
      example: "2fa habilitado. Código de verificação enviado para o e-mail.",
    },
    tempToken: {
      type: "string",
      description: "Token temporário JWT usado para validar o 2FA na próxima rota.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  },
  required: ["message", "tempToken"],
};

// --- 4. RESPOSTA 400: ERRO ZOD ---
const zodErrorResponseDoc = {
  type: "object",
  description: "Erro de validação de dados de entrada (ZodError).",
  properties: {
    message: { type: "string", example: "Dados de entrada em formato inválido" },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "array", items: { type: "string" } },
          message: { type: "string" },
        },
      },
    },
  },
};

// --- 5. RESPOSTA 401/404/500: ERROS DE AUTENTICAÇÃO/SISTEMA (AppError) ---
const appErrorResponseDoc = {
  type: "object",
  description: "Erro retornado por AppError ou erro interno.",
  properties: {
    message: { type: "string", example: "Email ou senha inválidos." },
    code: { type: "number", example: 401 },
  },
};

const authLoginRouteSchema = {
  tags: ["Autenticação"],
  summary: "Autentica o usuário com email e senha.",
  description:
    "Retorna o token de acesso (JWT) ou, se o 2FA estiver habilitado, retorna um token temporário e dispara o envio do código.",
  operationId: "authLogin",

  body: authLoginBodySchemaDoc,

  response: {
    // ✅ 200 OK (Define as duas respostas possíveis)
    200: {
      description: "Login bem-sucedido ou 2FA necessário.", // Usa 'oneOf' para permitir duas estruturas de resposta diferentes
      oneOf: [loginSuccessResponseDoc, twoFactorRequiredResponseDoc],
    }, // ❌ 400 Bad Request (ZodError)

    400: zodErrorResponseDoc, // ❌ 401 Unauthorized (Email/Senha inválidos, AppError)

    401: appErrorResponseDoc, // ❌ 500 Internal Server Error

    500: {
      description: "Erro interno do servidor.",
    },
  },
};
const bodySchema = z.object({
  email: z.email(),
  password: z.string(),
});
export async function authLoginRoute(app: FastifyInstance) {
  app.post("/login", { schema: authLoginRouteSchema }, async (request, reply) => {
    try {
      const { email, password } = bodySchema.parse(request.body);

      const result = await authLoginFunction(app, { email, password });
      const user = result.user;
      if (user.two_factor_enabled) {
        const sendResult = await twoFactorSendFunction(user.id);

        const tempToken = await generateTwoFactorTempToken(app, user.id, user.email, user.name);
        return reply.status(200).send({
          message: "2fa habilitado. Código de verificação enviado para o e-mail.",
          tempToken: tempToken,
        });
      }

      reply.setCookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60,
        path: "/",
      });
      return reply.status(200).send({
        message: "Login bem-sucedido",
        accessToken: result.accessToken,
      });
    } catch (error) {
      app.log.error(error, "Erro ao tentar logar usuário");
      if (error instanceof AppError) {
        type AppErrorStatusCode = 401 | 200 | 400 | 500;

        const statusCode = error.statusCode as AppErrorStatusCode;

        return reply.status(statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Dados de entrada em formato inválido",
          errors: error.issues, // Retorna erros por campo
        });
      }

      return reply.status(500).send({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  });
}
