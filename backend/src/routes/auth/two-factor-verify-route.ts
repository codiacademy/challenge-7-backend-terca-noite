import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { z } from "zod";
import bcrypt from "bcrypt";
import type { Payload } from "../../types/auth/refresh-token-types.ts";
import { verify2faCodeFunction } from "../../functions/auth/verify-2fa-code-function";
import { generateTokens } from "../../utils/tokens-service";

const twoFactorVerifyBodyDoc = {
  type: "object",
  properties: {
    code: {
      type: "string",
      minLength: 6,
      maxLength: 6,
      description: "Código de verificação de 6 dígitos enviado por e-mail (2FA code).",
    },
  },
  required: ["code"],
};

// Esquema de Resposta de Sucesso (200)
const twoFactorVerifySuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Autenticação 2FA concluída com sucesso",
      description: "Confirmação de que a verificação 2FA foi bem-sucedida.",
    },
    accessToken: {
      type: "string",
      description: "Token JWT de acesso (access token).",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  },
  required: ["message", "accessToken"],
};

// --- 2. ESQUEMAS DE ERRO (Reutilizando padrões) ---

const authErrorResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Token ausente",
      description: "Mensagem de erro de autenticação/token inválido.",
    },
    code: {
      type: "number",
      example: 401,
      description: "Código de status HTTP (ou código customizado).",
    },
  },
};

const expiredErrorResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Seu código está expirado",
    },
    code: { type: "number", example: 401 },
  },
};

const wrongCodeErrorResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Código incorreto!",
    },
    code: {
      type: "number",
      example: 401,
    },
  },
};

const validationErrorResponseDoc = {
  type: "object",
  properties: {
    message: { type: "string", example: "Dados de entrada em formato inválido" },
    errors: {
      type: "array",
      description: "Detalhes dos erros de validação Zod (Ex: código com número errado de dígitos).",
    },
  },
};

// --- 3. ESQUEMA PRINCIPAL DA ROTA ---

const twoFactorVerifySchema = {
  tags: ["Autenticação"],
  summary: "Verifica o código 2FA e emite tokens de acesso e refresh.",
  description:
    "Rota final da autenticação de dois fatores. Requer um token temporário ('2fa_pending') no cabeçalho 'Authorization' e o código de verificação no corpo da requisição. Se o código for válido, emite tokens completos (access/refresh) e conclui o login.",
  operationId: "verifyTwoFactorCode",

  security: [{ bearerAuth: [] }],

  body: twoFactorVerifyBodyDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "Verificação 2FA bem-sucedida. Tokens de acesso e refresh emitidos.",
      ...twoFactorVerifySuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "Dados de entrada inválidos (Ex: código com tamanho incorreto).",
      ...validationErrorResponseDoc,
    },
    // ❌ 401 Unauthorized/Token Inválido/Expirado/Código Incorreto
    401: {
      description: "Token ausente, inválido, expirado ou código de verificação incorreto.",
      oneOf: [
        authErrorResponseDoc, // Para erros de token ausente/tipo errado
        expiredErrorResponseDoc, // Para token expirado (FAST_JWT_EXPIRED)
        wrongCodeErrorResponseDoc, // Para código 2FA incorreto
      ],
    },
    // ❌ 500 Internal Server Error
    500: {
      description: "Erro interno do servidor.",
      type: "object",
      properties: {
        message: { type: "string", example: "Erro interno no servidor" },
        code: { type: "number", example: 500 },
      },
    },
  },
};

const userIdSchema = z.uuid();

const bodySchema = z.object({
  code: z.string().min(6).max(6, "O código deve ter 6 dígitos"),
});
export async function twoFactorVerifyRoute(app: FastifyInstance) {
  app.post("/verify", { schema: twoFactorVerifySchema }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;

      if (!authHeader) throw new AppError("Auth Header ausente", 401);
      const tempToken = authHeader.split(" ")[1];
      if (!tempToken) throw new AppError("Token ausente", 401);
      const decoded = await app.jwt.verify<Payload>(tempToken);

      if (decoded.type != "2fa_pending") {
        throw new AppError("Token inválido para 2FA", 401);
      }

      const { code } = bodySchema.parse(request.body as { code: string });

      const isRightCode = await verify2faCodeFunction({ userId: decoded.id, code });

      if (isRightCode) {
        const tokens = await generateTokens(app, {
          userId: decoded.id,
          email: decoded.email,
          name: decoded.name ?? "",
        });

        reply.setCookie("refreshToken", tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        return reply.status(200).send({
          message: "Autenticação 2FA concluída com sucesso",
          accessToken: tokens.accessToken,
        });
      } else {
        return reply.status(401).send({
          message: "Código incorreto!",
        });
      }

      // Gera access/refresh tokens completos
    } catch (error: any) {
      app.log.error(error, "Erro ao tentar verificar código 2FA");

      if (error.code === "FAST_JWT_EXPIRED") {
        return reply.status(401).send({
          message: "Seu código está expirado",
          code: 401,
        });
      }

      if (error instanceof AppError) {
        type AppErrorStatusCode = 400 | 401 | 500 | 200;

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
        message: "Erro interno no servidor",
        code: 500,
      });
    }
  });
}
