import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { z } from "zod";
import { twoFactorSendFunction } from "../../functions/auth/two-factor-send-function";
import { generateTwoFactorTempToken } from "../../utils/tokens-service";
import type { Payload } from "../../types/auth/refresh-token-types.ts";

// --- 1. ESQUEMA DE RESPOSTA DE SUCESSO (200) ---
const resendTwoFactorSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: " Código de verificação enviado para o e-mail.",
      description: "Confirmação do reenvio do código de 2FA.",
    },
    tempToken: {
      type: "string",
      description: "Novo token temporário JWT (2fa_pending) com validade estendida.",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  },
  required: ["message", "tempToken"],
};

// --- 2. ESQUEMAS DE ERRO ---
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
      example: "Seu código expirou. Faça login novamente.",
    },
    code: { type: "string", example: "TEMP_TOKEN_EXPIRED" },
  },
};

const resendTwoFactorSchema = {
  tags: ["Autenticação"],
  summary: "Reenvia o código de Autenticação de Dois Fatores (2FA).",
  description:
    "Requer um token temporário ('2fa_pending') no cabeçalho 'Authorization'. Envia um novo código por e-mail e retorna um novo token temporário para renovar o prazo de espera.",
  operationId: "resendTwoFactorCode", // 🚨 Documenta a necessidade de um token no header (Token Temporário)

  security: [{ bearerAuth: [] }],

  response: {
    // ✅ 200 OK
    200: {
      description: "Código de 2FA reenviado com sucesso.",
      ...resendTwoFactorSuccessResponseDoc,
    }, // ❌ 401 Unauthorized/Token Inválido/Expirado

    401: {
      description: "Token ausente, inválido ou expirado.",
      oneOf: [
        authErrorResponseDoc, // Para erros de token ausente/inválido
        expiredErrorResponseDoc, // Para token expirado (FAST_JWT_EXPIRED)
      ],
    }, // ❌ 500 Internal Server Error

    500: {
      description: "Erro interno do servidor ao tentar reenviar o código.",
      type: "object",
      properties: {
        message: { type: "string", example: "Erro interno do servidor: [Detalhe]" },
      },
    },
  },
};

export async function resendTwoFactor(app: FastifyInstance) {
  app.post("/resend_two_factor", { schema: resendTwoFactorSchema }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new AppError("Auth Header ausente", 401);
      const tempToken = authHeader.split(" ")[1];

      if (!tempToken) throw new AppError("Token ausente", 401);
      // Decodificar o token temporário
      const decoded = await app.jwt.verify<Payload>(tempToken);

      if (decoded.type != "2fa_pending") {
        throw new AppError("Token inválido para 2FA", 401);
      }
      console.log("Chegou no send!");
      await twoFactorSendFunction(decoded.id);

      const newTempToken = await generateTwoFactorTempToken(
        app,
        decoded.id,
        decoded.email,
        decoded.name,
      );
      return reply.status(200).send({
        message: " Código de verificação enviado para o e-mail.",
        tempToken: newTempToken,
      });
    } catch (error: any) {
      if (error.code === "FAST_JWT_EXPIRED") {
        return reply.status(401).send({
          message: "Seu código expirou. Faça login novamente.",
          code: "TEMP_TOKEN_EXPIRED",
        });
      }
      app.log.error(error, "Erro ao tentar reenviar código ao usuário");
      if (error instanceof AppError) {
        type AppErrorStatusCode = 401 | 200 | 500;

        const statusCode = error.statusCode as AppErrorStatusCode;
        return reply.status(statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
      console.log("Erro aconteceu:" + error);
      return reply.status(500).send({
        message: "Erro interno do servidor: " + (error.message || String(error)),
      });
    }
  });
}
