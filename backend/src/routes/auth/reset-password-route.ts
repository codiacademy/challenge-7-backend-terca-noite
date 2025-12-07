import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
import { verify2faCodeFunction } from "../../functions/auth/verify-2fa-code-function";
import { updateUserPasswordFunction } from "../../functions/users/update-user-password-function";

import type { Payload } from "../../types/auth/refresh-token-types.ts";

const bodySchema = z.object({
  code: z.string().min(6).max(6, "O código deve ter 6 dígitos"),
  password: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres"),
});

const resetPasswordBodyDoc = {
  type: "object",
  properties: {
    code: {
      type: "string",
      minLength: 6,
      maxLength: 6,
      description: "Código de verificação de 6 dígitos enviado por e-mail (2FA code).",
    },
    password: {
      type: "string",
      description: "A nova senha do usuário (mínimo de 8 caracteres).",
    },
  },
  required: ["code", "password"],
};

// Esquema de Resposta de Sucesso (200)
const updatedUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  // Outros campos relevantes do usuário
});

const resetPasswordSuccessResponseDoc = {
  type: "object",
  properties: {
    message: {
      type: "string",
      example: "Senha alterada com sucesso! Faça login a seguir!",
      description: "Confirmação de que a senha foi atualizada.",
    },
    changedUser: {
      ...updatedUserSchema.shape, // Reutiliza a estrutura do Zod para o objeto 'user'
      description: "Dados básicos do usuário com a senha atualizada.",
    },
  },
  required: ["message", "changedUser"],
};

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
      description: "Detalhes dos erros de validação Zod (Ex: senha curta).",
    },
  },
};

const resetPasswordSchema = {
  tags: ["Autenticação"],
  summary: "Finaliza a redefinição de senha e atualiza a senha do usuário.",
  description:
    "Requer um token temporário ('2fa_pending') no cabeçalho 'Authorization'. Verifica o código 2FA e, se correto, atualiza a senha do usuário com a nova senha fornecida.",
  operationId: "resetPassword",

  security: [{ bearerAuth: [] }],

  body: resetPasswordBodyDoc,

  response: {
    // ✅ 200 OK
    200: {
      description: "Senha alterada com sucesso.",
      ...resetPasswordSuccessResponseDoc,
    },
    // ❌ 400 Bad Request
    400: {
      description: "Dados de entrada inválidos (Ex: senha muito curta).",
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
        message: { type: "string", example: "Erro interno do servidor: [Detalhe]" },
      },
    },
  },
};
export async function resetPasswordRoute(app: FastifyInstance) {
  app.post("/reset_password", { schema: resetPasswordSchema }, async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) throw new AppError("Auth Header ausente", 401);
      const tempToken = authHeader.split(" ")[1];

      if (!tempToken) throw new AppError("Token ausente", 401);

      const decoded = await app.jwt.verify<Payload>(tempToken);

      if (decoded.type != "2fa_pending") {
        throw new AppError("Token inválido para 2FA", 401);
      }

      const { code, password } = bodySchema.parse(request.body);
      console.log("Codigo e nova senha pegas");

      const isRightCode = await verify2faCodeFunction({ userId: decoded.id, code });
      console.log("Codigo verificado: " + isRightCode);
      if (isRightCode) {
        const changedUser = await updateUserPasswordFunction({ userId: decoded.id, password });
        reply.header("Content-Type", "application/json");
        return reply.type("application/json").status(200).send({
          message: "Senha alterada com sucesso! Faça login a seguir!",
          changedUser,
        });
      } else {
        return reply.status(401).send({
          message: "Código incorreto!",
        });
      }
    } catch (error: any) {
      if (error.code === "FAST_JWT_EXPIRED") {
        return reply.status(401).send({
          message: "Seu código expirou. Faça login novamente.",
          code: "TEMP_TOKEN_EXPIRED",
        });
      }
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          message: "Dados de entrada em formato inválido",
          errors: error.issues, // Retorna erros por campo
        });
      }
      if (error instanceof AppError) {
        type AppErrorStatusCode = 401 | 200 | 400 | 500;

        const statusCode = error.statusCode as AppErrorStatusCode;
        return reply.status(statusCode).send({
          message: error.message,
          code: error.statusCode,
        });
      }
    }
  });
}
