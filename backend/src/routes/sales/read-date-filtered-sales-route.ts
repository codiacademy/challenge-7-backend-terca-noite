import z from "zod";
import type { FastifyInstance } from "fastify";
import { readDateFilteredSalesFunction } from "../../functions/sales/read-date-filtered-sales-function";

// Estrutura de um único item de venda (baseada em exemplos anteriores)
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
      description: "Timestamp de criação da venda.",
    }, // Inclua aqui todos os campos que a função readDateFilteredSalesFunction retorna para cada venda.
  },
};

// Estrutura da Resposta de Sucesso 200
const successResponseDoc = {
  type: "object",
  required: ["message", "sales", "total"],
  properties: {
    message: {
      type: "string",
      example:
        "Vendas do Período de 2024-01-01T00:00:00.000Z até 2024-01-31T00:00:00.000Z mostradas com sucesso",
      description: "Mensagem de sucesso com as datas de filtro aplicadas.",
    },
    sales: {
      type: "array",
      description: "Lista de vendas filtradas pelo período.",
      items: singleSaleItemDoc,
    },
    total: {
      type: "number",
      minimum: 0,
      description: "Contagem total de vendas encontradas no período.",
    },
  },
};

const readDateFilteredSalesSchema = {
  tags: ["Vendas"],
  summary: "Lista vendas filtradas por período de data.",
  description:
    "Busca e retorna uma lista de vendas para o usuário autenticado, aplicando filtros opcionais 'from' e 'to' na data de criação.",

  security: [{ bearerAuth: [] }],

  querystring: {
    type: "object",
    properties: {
      from: {
        type: "string",
        description: "Data inicial do período a ser filtrado (opcional).",
      },
      to: {
        type: "string",
        description: "Data final do período a ser filtrado (opcional).",
      },
    },
  },

  response: {
    200: {
      description: "Vendas listadas com sucesso.",
      type: successResponseDoc.type,
      required: successResponseDoc.required,
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
        error: { type: "string", example: "Erro ao listar vendas filtradas" },
      },
    },
  },
};
const querySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export async function readDateFilteredSalesRoute(app: FastifyInstance) {
  app.get(
    "/read_date_filtered_sales",
    {
      preHandler: [app.authenticate],
      schema: readDateFilteredSalesSchema,
    },
    async (request, reply) => {
      try {
        const { id: userId } = request.user as any;

        const filters = querySchema.parse(request.query);

        const result = await readDateFilteredSalesFunction(userId, filters);

        return reply.status(200).send({
          message: `Vendas do Período de ${filters.from} até ${filters.to}  mostradas com sucesso`,
          ...result,
        });
      } catch (error) {
        console.error("Erro ao mostrar todas as vendas do período:", error);
        return reply.status(500).send({ error: "Erro ao listar vendas filtradas" });
      }
    },
  );
}
