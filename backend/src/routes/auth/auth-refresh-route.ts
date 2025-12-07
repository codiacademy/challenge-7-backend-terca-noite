import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { env } from "../../config/env";
import { AppError } from "../../utils/app-error";
import z, { any } from "zod";
import type { FastifyJWT } from "@fastify/jwt";
import { authRefreshFunction } from "../../functions/auth/auth-refresh-function";
import type { Payload } from "../../types/auth/refresh-token-types.ts";

// --- 1. ESQUEMA DE RESPOSTA DE SUCESSO (200) ---
const authRefreshSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Refresh Token gerado com sucesso.",
      description: "Mensagem de confirmação.",
    },
    accessToken: {
      type: "string",
      description: "Novo Token de Acesso JWT gerado.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  },
  required: ["message", "accessToken"],
};

// --- 2. ESQUEMAS DE ERRO (Reutilizando o padrão AppError) ---
const appErrorResponseDoc = {
  type: "object",
  properties: {
    message: { type: "string", example: "Refresh token ausente" },
    code: { type: "number", example: 401 },
  },
};

const authRefreshRouteSchema = {
  tags: ["Autenticação"],
  summary: "Gera um novo Access Token usando o Refresh Token (cookie).",
  description:
    "Esta rota deve ser chamada periodicamente para obter um novo Access Token. Ela exige que um Refresh Token válido seja enviado nos cookies. Em caso de sucesso, emite um novo Access Token no corpo da resposta e um novo Refresh Token no cookie (sliding session).",
  operationId: "authRefresh", // A autenticação e a leitura do token são feitas via cookie no preHandler
  // Nenhuma exigência de 'security' JWT no header, pois usa cookie/preHandler.

  security: [], // Não há corpo, parâmetros ou query strings necessários para esta requisição.

  response: {
    // ✅ 200 OK
    200: {
      description: "Novo Access Token gerado com sucesso.",
      ...authRefreshSuccessResponseDoc,
    }, // ❌ 401 Unauthorized (Token inválido, expirado ou ausente)

    401: {
      description: "Não autorizado (Refresh Token inválido, expirado, ausente, ou tipo incorreto).",
      ...appErrorResponseDoc,
    }, // ❌ 500 Internal Server Error

    500: {
      description: "Erro interno do servidor.",
      ...appErrorResponseDoc,
    }, // Para o caso de ZodError na decodificação (embora improvável aqui):
    400: {
      description: "Erro de validação de formato do token.",
      type: "object",
      properties: {
        message: { type: "string", example: "Dados de entrada em formato inválido" },
        errors: { type: "array" },
      },
    },
  },
};

export async function authRefreshRoute(app: FastifyInstance) {
  app.post(
    "/refresh",
    {
      preHandler: app.verifyRefreshToken,
      schema: authRefreshRouteSchema,
    },
    async (request, reply) => {
      try {
        const refreshToken = await request.cookies?.refreshToken;
        if (!refreshToken) {
          throw new AppError("Refresh token ausente", 401);
        }
        const decoded = await app.jwt.verify<Payload>(refreshToken);
        console.log("🔍 Decoded Refresh Token:", JSON.stringify(decoded, null, 2));
        if (decoded.type !== "refresh") {
          throw new AppError("Este token não é de refresh", 401);
        }

        const { id } = decoded;
        const tokens = await authRefreshFunction(app, {
          userId: decoded.id,
          decodedToken: decoded,
          refreshToken,
        });
        return reply
          .setCookie("refreshToken", tokens.refreshToken, {
            path: "/",
            secure: true,
            sameSite: "strict",
            httpOnly: true,
          })
          .status(200)
          .send({
            message: "Refresh Token gerado com sucesso.",
            accessToken: tokens.accessToken,
          });
      } catch (error) {
        app.log.error(error, "Erro ao tentar dar refresh no usuário");
        if (error instanceof AppError) {
          type AppErrorStatusCode = 401 | 200 | 500 | 400;

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
        console.error("Erro no /refresh:", error);
        return reply.status(500).send({
          message: "Erro interno do servidor. Tente novamente mais tarde.",
        });
      }
    },
  );
}
