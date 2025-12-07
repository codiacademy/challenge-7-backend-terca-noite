import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { updateSaleFunction } from "../../functions/sales/update-sale-function";

const saleParamsSchemaDoc = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "ID (UUID) da venda a ser atualizada.",
    },
  },
};

const saleBodySchemaDoc = {
  type: "object",
  required: ["customer", "course", "finalPrice"],
  properties: {
    customer: {
      type: "object",
      required: ["name", "email", "phone", "cpf"],
      properties: {
        name: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        cpf: { type: "string" },
      },
    },
    course: {
      type: "object",
      required: ["type", "name", "price"],
      properties: {
        type: { type: "string", enum: ["presencial", "online"] },
        name: { type: "string" },
        price: { type: "number" },
      },
    },
    discount: { type: "number" },
    taxes: { type: "number" },
    commissions: { type: "number" },
    cardFees: { type: "number" },
    finalPrice: { type: "number" },
    created_at: { type: "string", format: "date-time" }, // Exemplo de campo adicional
    updated_at: { type: "string", format: "date-time" }, // Exemplo de campo adicional
  },
};

// Assumindo que updatedSale retorna a venda no mesmo formato do body,
// mas com campos adicionais de retorno do DB, como ID e datas de criação/atualização.
const updatedSaleResponseDoc = {
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

// --- ESQUEMA COMPLETO DA ROTA (Swagger/OpenAPI) ---
const updateSaleRouteSchema = {
  tags: ["Vendas"],
  summary: "Atualiza uma venda existente.",
  description:
    "Permite a atualização completa dos dados de uma venda específica identificada pelo ID. Requer autenticação e todos os campos no corpo.",

  security: [{ bearerAuth: [] }],
  params: saleParamsSchemaDoc,
  body: saleBodySchemaDoc,

  response: {
    200: {
      description: "Venda atualizada com sucesso",
      type: "object",
      properties: {
        message: { type: "string", example: "Venda atualizada com sucesso" },
        updatedSale: updatedSaleResponseDoc,
      },
    }, // Resposta para Erro de Validação (400)

    400: {
      description: "Dados de entrada em formato inválido (ID da venda ou corpo da requisição)",
      type: "object",
      properties: {
        message: { type: "string", example: "Dados de entrada em formato inválido" },
        errors: { type: "array" },
      },
    }, // Resposta para Erro de Autenticação/AppError (401, 404)

    401: {
      description: "Não autorizado (Token ausente ou inválido)",
      type: "object",
      properties: { message: { type: "string", example: "Unauthorized" } },
    },
    404: {
      description: "Venda não encontrada ou usuário não tem permissão para atualizar.",
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

export const bodySchema = z.object({
  customer: z.object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .nonempty("Nome completo é obrigatório"),

    email: z.email("E-mail inválido").nonempty("E-mail é obrigatório"),

    phone: z
      .string()
      .regex(/^\d{11}$/, "Telefone inválido (ex: (11) 9 9999-9999)")
      .nonempty("Telefone é obrigatório"),

    cpf: z
      .string()
      .nonempty("CPF é obrigatório")
      .min(11)
      .max(11, "CPF deve estar no formato correto"),
  }),

  course: z.object({
    type: z.enum(["presencial", "online"] as const, {
      message: "Tipo de curso inválido",
    }),

    name: z.string().nonempty("Curso é obrigatório"),

    price: z.number().min(0, "Valor do curso deve ser maior ou igual a 0"),
  }),

  discount: z.number().min(0, "Desconto deve ser maior ou igual a 0"),

  taxes: z.number().min(0, "Impostos devem ser maiores ou iguais a 0"),

  commissions: z.number().min(0, "Comissões devem ser maiores ou iguais a 0"),

  cardFees: z.number().min(0, "Taxas de cartão devem ser maiores ou iguais a 0"),

  finalPrice: z.number().min(0, "Valor final deve ser maior ou igual a 0"),
});

const userIdSchema = z.uuid();

export async function updateSaleRoute(app: FastifyInstance) {
  app.put(
    "/:id",
    {
      preHandler: [app.authenticate],
      schema: updateSaleRouteSchema,
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = userIdSchema.parse((request.user as any).id);
        const { customer, course, discount, taxes, commissions, cardFees, finalPrice } =
          bodySchema.parse(request.body);

        const updatedSale = await updateSaleFunction({
          id,
          userId,
          customer,
          course,
          discount,
          taxes,
          commissions,
          cardFees,
          finalPrice,
        });

        return reply.status(200).send({
          message: "Venda atualizada com sucesso",
          updatedSale,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar atualizar venda no DB");
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
            message: "Dados de entrada em formato inválido",
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
