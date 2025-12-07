import type { FastifyInstance } from "fastify";
import { readAllSalesFunction } from "../../functions/sales/read-all-sales-function";
import { z } from "zod";
import { AppError } from "../../utils/app-error";
const userIdSchema = z.uuid();

const singleSaleItemDoc = {
  type: "object",
  required: ["id", "client_name", "course", "total_value", "created_at"],
  properties: {
    id: { type: "string", format: "uuid", description: "ID único da venda." },
    client_name: { type: "string", description: "Nome do cliente." },
    course: { type: "string", description: "Nome do curso vendido." },
    total_value: { type: "number", minimum: 0, description: "Valor final/líquido da venda." },
    created_at: {
      type: "string",
      format: "date-time",
      description: "Timestamp de criação da venda.",
    }, // Adicionar mais campos que a função readAllSalesFunction retorna, se conhecido
  },
};

// Estrutura da Resposta de Sucesso 200
const successResponseDoc = {
  type: "object",
  required: ["message", "salesData"],
  properties: {
    message: {
      type: "string",
      example: "Todas as vendas listadas com sucesso",
      description: "Mensagem de sucesso.",
    },
    salesData: {
      type: "array",
      description: "Lista completa de vendas do usuário autenticado.",
      items: singleSaleItemDoc,
    },
  },
};

const readAllSalesSchema = {
  tags: ["Vendas"],
  summary: "Lista todas as vendas do usuário autenticado.",
  description:
    "Busca e retorna uma lista completa de todas as vendas associadas ao ID do usuário logado.",

  security: [{ bearerAuth: [] }],

  response: {
    200: {
      description: "Lista de vendas retornada com sucesso.",
      type: successResponseDoc.type, // 'object'
      required: successResponseDoc.required, // ['message', 'salesData']
      properties: successResponseDoc.properties,
    }, // Resposta para Erro de Autenticação

    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    }, // Resposta para Erro Interno (DB ou Lógica)

    500: {
      description: "Erro interno do servidor",
      type: "object",
      properties: {
        error: { type: "string", example: "Erro ao listar vendas" },
      },
    },
  },
};

export async function readAllSalesRoute(app: FastifyInstance) {
  app.get(
    "/read_all_sales",
    {
      preHandler: [app.authenticate],
      schema: readAllSalesSchema,
    },
    async (request, reply) => {
      try {
        const userId = userIdSchema.parse((request.user as any).id);
        const salesData = await readAllSalesFunction(userId);

        return reply.status(200).send({
          message: "Todas as vendas listadas com sucesso",
          salesData,
        });
      } catch (error) {
        if (error instanceof AppError) {
          type AppErrorStatusCode = 200 | 401 | 500;

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
