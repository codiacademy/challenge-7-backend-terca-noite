import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { authLogoutFunction } from "../../functions/auth/auth-logout-function";

import { z } from "zod";

const authLogoutSuccessResponseDoc = {
  type: "object",
  properties: {
    status: {
      type: "string",
      example: "Logout realizado com sucesso",
      description: "Mensagem de confirmação.",
    },
  },
  required: ["status"],
};

const appErrorResponseDoc = {
  type: "object",
  properties: {
    message: { type: "string", example: "O refreshToken não foi encontrado" },
    code: { type: "number", example: 401 },
  },
};

const authLogoutRouteSchema = {
  tags: ["Autenticação"],
  summary: "Realiza o logout do usuário e revoga o Refresh Token.",
  description:
    "Esta rota exige que um Refresh Token válido esteja presente nos cookies da requisição. Ele revoga o token no banco de dados e limpa o cookie do cliente.",
  operationId: "authLogout", // A autenticação é feita via Refresh Token no preHandler
  // O Swagger não documenta a exigência de cookies diretamente aqui, mas documentamos a função.
  // Nenhuma exigência de 'security' JWT no header, pois usa cookie/preHandler.

  security: [], // Não há corpo, parâmetros ou query strings necessários para esta rota.

  response: {
    // ✅ 200 OK
    200: {
      description: "Logout concluído e Refresh Token revogado/limpo.",
      ...authLogoutSuccessResponseDoc,
    }, // ❌ 401 Unauthorized (Token inválido, ausente ou ID de usuário inválido)

    401: {
      description: "Não autorizado (Refresh Token inválido ou ausente).",
      ...appErrorResponseDoc,
    }, // ❌ 500 Internal Server Error

    500: {
      description: "Erro interno do servidor.",
      ...appErrorResponseDoc,
    },
  },
};

const userIdSchema = z.uuid();

export async function authLogoutRoute(app: FastifyInstance) {
  app.post(
    "/logout",
    { preHandler: app.verifyRefreshToken, schema: authLogoutRouteSchema },
    async (request, reply) => {
      try {
        const logoutUserId = userIdSchema.parse((request.user as any).id);
        const refreshToken = await request.cookies?.refreshToken;
        console.log("Refresh Token no logout:", refreshToken);
        if (!refreshToken) {
          throw new AppError(" O refreshToken não foi encontrado", 401);
        }

        const userExits = await authLogoutFunction(app, refreshToken, logoutUserId);
        reply.clearCookie("refreshToken", {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });
        return reply.status(200).send({ status: "Logout realizado com sucesso" });
      } catch (error) {
        app.log.error(error, "Erro ao tentar deslogar usuário");
        if (error instanceof AppError) {
          type AppErrorStatusCode = 401 | 200 | 500;

          const statusCode = error.statusCode as AppErrorStatusCode;
          return reply.status(statusCode).send({
            message: error.message,
            code: error.statusCode,
          });
        }

        return reply.status(500).send({
          message: "Erro interno do servidor. Tente novamente mais tarde.",
        });
      }
    },
  );
}
