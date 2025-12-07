import z from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { verifyEmailFunction } from "../../functions/auth/verify-email-function";
import { getIdFromEmailFunction } from "../../functions/users/get-id-from-email-function";
import { getNameFromEmailFunction } from "../../functions/users/get-name-from-email-function";

import { twoFactorSendFunction } from "../../functions/auth/two-factor-send-function";
import { generateTwoFactorTempToken } from "../../utils/tokens-service";

// --- 1. ESQUEMAS DE DADOS ---

// Esquema do Corpo da Requisição (Input) para o Swagger
const verifyEmailBodyDoc = {
  type: "object",
  properties: {
    email: {
      type: "string",
      description: "Endereço de e-mail do usuário para verificação e envio do código.",
    },
  },
};

// Esquema de Resposta de Sucesso (200)
const verifyEmailSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: " Código de verificação enviado para o e-mail.",
      description: "Confirmação do envio do código de 2FA.",
    },
    tempToken: {
      type: "string",
      description:
        "Token temporário JWT ('2fa_pending') necessário para as próximas etapas (ex: redefinição de senha ou verificação 2FA).",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
  },
  required: ["message", "tempToken"],
};

// --- 2. ESQUEMAS DE ERRO ---

const notFoundErrorResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Email não encontrado.",
      description: "Mensagem de erro quando o e-mail não está cadastrado.",
    },
    code: {
      type: "number",
      example: 404,
      description: "Código de status HTTP.",
    },
  },
};

const validationErrorResponseDoc = {
  type: "object",
  properties: {
    message: { type: "string", example: "Email em formato inválido" },
    errors: { type: "array", description: "Detalhes dos erros de validação Zod." },
  },
};

// --- 3. ESQUEMA PRINCIPAL DA ROTA ---

const verifyEmailSchema = {
  tags: ["Autenticação"],
  summary: "Verifica se um e-mail está cadastrado e inicia o processo de 2FA/Redefinição.",
  description:
    "Recebe um e-mail, verifica se ele existe no sistema e, se sim, envia um código de verificação 2FA para o e-mail e retorna um token temporário ('2fa_pending').",
  operationId: "verifyEmailAndSendCode",

  body: verifyEmailBodyDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "E-mail verificado e código de 2FA enviado com sucesso.",
      ...verifyEmailSuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "Dados de entrada inválidos (Formato do e-mail).",
      oneOf: [validationErrorResponseDoc],
    },
    // ❌ 404 Not Found
    404: {
      description: "E-mail não encontrado no sistema (AppError).",
      ...notFoundErrorResponseDoc,
    },
    // ❌ 500 Internal Server Error
    500: {
      description: "Erro interno do servidor.",
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Erro interno do servidor. Tente novamente mais tarde.",
        },
      },
    },
  },
};
const emailSchema = z.object({
  email: z.email(),
});
export async function verifyEmailRoute(app: FastifyInstance) {
  app.post("/verify_email", { schema: verifyEmailSchema }, async (request, reply) => {
    try {
      const body = emailSchema.parse(request.body);
      const emailExists = await verifyEmailFunction(body.email);
      if (emailExists) {
        const userId = await getIdFromEmailFunction(body.email);
        const name = await getNameFromEmailFunction(body.email);
        await twoFactorSendFunction(userId);
        const newTempToken = await generateTwoFactorTempToken(app, userId, body.email, name);
        return reply.status(200).send({
          message: " Código de verificação enviado para o e-mail.",
          tempToken: newTempToken,
        });
      }
    } catch (error) {
      app.log.error(error, "Erro ao tentar verificar email no DB");
      if (error instanceof AppError) {
        type AppErrorStatusCode = 400 | 404 | 500 | 200;

        const statusCode = error.statusCode as AppErrorStatusCode;
        return reply.status(statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Email em formato inválido",
          errors: error.issues, // Retorna erros por campo
        });
      }

      return reply.status(500).send({
        message: "Erro interno do servidor. Tente novamente mais tarde.",
      });
    }
  });
}
