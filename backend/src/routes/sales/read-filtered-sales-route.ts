import z, { ZodType } from "zod";
import type { FastifyInstance } from "fastify";
import { readFilteredSalesFunction } from "../../functions/sales/read-filtered-sales-function";

const emptyStringToUndefined = z.literal("").transform(() => undefined);

// Função auxiliar para aceitar ZodType e tratar strings vazias
const optionalString = (schema: ZodType<string>) =>
  z.union([schema, emptyStringToUndefined]).optional();
// ----------------------------------------------------------------------------
// Estrutura de um único item de venda (baseada em exemplos anteriores)
const singleSaleItemDoc = {
  type: "object",
  description: "Estrutura detalhada de um único item de venda.",
  required: [
    "id",
    "client_name",
    "cpf",
    "client_phone",
    "client_email",
    "course",
    "course_type",
    "course_value",
    "discount_value",
    "taxes_value",
    "commission_value",
    "card_fee_value",
    "total_value",
    "created_at",
    "updated_at",
    "created_by",
  ],
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID único da venda (UUID).",
    },
    client_name: {
      type: "string",
      description: "Nome completo do cliente.",
    },
    cpf: {
      type: "string",
      description: "Número de CPF do cliente.",
    },
    client_phone: {
      type: "string",
      description: "Telefone de contato do cliente.",
    },
    client_email: {
      type: "string",
      format: "email",
      description: "E-mail do cliente.",
    },
    course: {
      type: "string",
      description: "Nome do curso vendido.",
    },
    course_type: {
      type: "string",
      description: "Tipo do curso (ex: 'online', 'presencial').",
    },
    course_value: {
      type: "number",
      minimum: 0,
      description: "Valor bruto do curso antes de descontos/taxas.",
    },
    discount_value: {
      type: "number",
      minimum: 0,
      description: "Valor total de desconto aplicado.",
    },
    taxes_value: {
      type: "number",
      minimum: 0,
      description: "Valor total de impostos/taxas governamentais aplicadas.",
    },
    commission_value: {
      type: "number",
      minimum: 0,
      description: "Valor da comissão calculada sobre a venda.",
    },
    card_fee_value: {
      type: "number",
      minimum: 0,
      description: "Taxa do cartão de crédito/débito aplicada.",
    },
    total_value: {
      type: "number",
      minimum: 0,
      description: "Valor final/líquido da venda após todos os cálculos (o que entra no caixa).",
    },
    created_at: {
      type: "string",
      format: "date-time",
      description: "Timestamp de criação do registro de venda.",
    },
    updated_at: {
      type: "string",
      format: "date-time",
      description: "Timestamp da última atualização do registro.",
    },
    created_by: {
      type: "string",
      format: "uuid",
      description: "ID do usuário que criou a venda (Chave estrangeira).",
    },
  },
};

const paginationMetadataDoc = {
  type: "object",
  properties: {
    currentPage: { type: "number", example: 1, description: "Página atual retornada." },
    totalPages: { type: "number", example: 5, description: "Número total de páginas disponíveis." },
    totalItems: {
      type: "number",
      example: 45,
      description: "Número total de itens (vendas) que correspondem ao filtro.",
    },
    limit: { type: "number", example: 10, description: "Número máximo de itens por página." },
  },
  required: ["currentPage", "totalPages", "totalItems", "limit"],
};
// Estrutura da Resposta de Sucesso 200
const successResponseDoc = {
  type: "object",
  required: ["message", "sales", "pagination"],
  properties: {
    message: {
      type: "string",
      example: "Vendas filtradas listadas com sucesso",
      description: "Mensagem de sucesso.",
    },
    sales: {
      type: "array",
      description: "Lista de vendas filtradas e paginadas.",
      items: singleSaleItemDoc,
    },
    pagination: paginationMetadataDoc,
  },
};
const readFilteredSalesSchema = {
  tags: ["Vendas"],
  summary: "Busca vendas com filtros e paginação.",
  description:
    "Retorna uma lista de vendas com filtros opcionais (tipo de curso, pesquisa por termo, intervalo de datas) e com paginação controlada por 'page' e 'limit'.",

  security: [{ bearerAuth: [] }],

  querystring: {
    type: "object",
    properties: {
      courseType: {
        type: "string",
        description: "Filtro pelo tipo de curso (ex: 'online', 'presencial').",
      },
      search: {
        type: "string",
        description: "Termo de pesquisa para nome do cliente ou curso.",
      },
      from: {
        type: "string",
        description: "Data inicial do período de criação (opcional).",
      },
      to: {
        type: "string",
        description: "Data final do período de criação (opcional).",
      },
      page: {
        type: "number",
        default: 1,
        minimum: 1,
        description: "Número da página atual (para paginação).",
      },
      limit: {
        type: "number",
        default: 10,
        minimum: 1,
        maximum: 50,
        description: "Número de itens por página (limite de 50).",
      },
    },
  },

  response: {
    200: {
      description: "Vendas filtradas e paginadas listadas com sucesso.",
      type: successResponseDoc.type,
      required: successResponseDoc.required,
      properties: successResponseDoc.properties,
    }, // Resposta para Erro de Autenticação

    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    }, // Resposta para Erro de Validação (Zod) ou Erro Interno

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
  courseType: optionalString(z.string()),
  search: optionalString(z.string()),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function readFilteredSalesRoute(app: FastifyInstance) {
  app.get(
    "/read_filtered_sales",
    {
      preHandler: [app.authenticate],
      schema: readFilteredSalesSchema,
    },
    async (request, reply) => {
      try {
        const { id: userId } = request.user as any;

        const filters = querySchema.parse(request.query);

        const result = await readFilteredSalesFunction(userId, filters);

        return reply.status(200).send({
          message: "Vendas filtradas listadas com sucesso",
          sales: result.sales,
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            limit: result.limit,
          },
        });
      } catch (error) {
        console.error("Erro ao listar vendas filtradas:", error);
        return reply.status(500).send({ error: "Erro ao listar vendas filtradas" });
      }
    },
  );
}
