import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { deleteSaleFunction } from "../../functions/sales/delete-sale-function";
import { appErrorSchema, zodErrorSchema } from "../../types/errors-types";

// --- 1. JSON SCHEMA PARA OS PARÂMETROS DA ROTA ---
const saleParamsSchemaDoc = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID (UUID) da venda a ser deletada.",
    },
  },
};

// --- 2. JSON SCHEMA PARA A RESPOSTA 200 (Saída de Sucesso) ---
// Assumindo que a função deleteSaleFunction retorna o ID da venda deletada
const deletedSaleResponseDoc = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID da venda que foi deletada.",
    },
    // Adicione outros campos se a função retornar mais detalhes do usuário logado (result.user)
  },
};

// --- 3. ESQUEMA COMPLETO DA ROTA (Swagger/OpenAPI) ---
const deleteSaleRouteSchema = {
  tags: ["Vendas"],
  summary: "Deleta uma venda específica.",
  description:
    "Deleta um registro de venda usando seu ID, se o usuário autenticado tiver permissão.",

  security: [{ bearerAuth: [] }],

  params: saleParamsSchemaDoc,

  response: {
    200: {
      description: "Venda deletada com sucesso",
      type: "object",
      properties: {
        message: { type: "string", example: "Venda deletada com sucesso" },
        user: deletedSaleResponseDoc, // Retorna os detalhes do item deletado
      },
    }, // Resposta para Erro de Validação Zod (400) - ID inválido

    400: {
      description: "ID de venda em formato inválido",
      type: "object",
      properties: {
        message: { type: "string", example: "ID de venda em formato inválido" },
        errors: { type: "array" }, // Detalhes do erro Zod
      },
    }, // Resposta para Erro de Autenticação/AppError (401, 404)

    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: {
        message: { type: "string", example: "Unauthorized" },
      },
    },
    404: {
      description: "Venda não encontrada ou recurso não encontrado.",
      type: "object",
      properties: {
        message: { type: "string", example: "Venda não encontrada." },
        code: { type: "number", example: 404 },
      },
    }, // Resposta para Erro Interno do Servidor (500)

    500: {
      description: "Erro interno do servidor",
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

const saleIdSchema = z.uuid();
export async function deleteSaleRoute(app: FastifyInstance) {
  app.delete(
    "/:id",
    {
      preHandler: [app.authenticate],
      schema: deleteSaleRouteSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const saleId = saleIdSchema.parse(id);
        const result = await deleteSaleFunction(saleId);

        return reply.status(200).send({
          message: "Venda deletada com sucesso",
          user: result,
        });
      } catch (error: any) {
        app.log.error(error, "Erro ao tentar deletar venda no DB");
        if (error instanceof AppError) {
          type AppErrorStatusCode = 404 | 200 | 400 | 401 | 500;

          const statusCode = error.statusCode as AppErrorStatusCode;
          return reply.status(statusCode).send({
            message: error.message,
            code: error.statusCode,
          });
        }
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            message: "ID de venda em formato inválido",
            errors: error.issues, // Retorna erros por campo
          });
        }

        return reply.status(500).send({
          message: "Erro interno do servidor. Tente novamente mais tarde.",
        });
      }
    },
  );
}
