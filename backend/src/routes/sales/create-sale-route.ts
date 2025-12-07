import { z } from "zod";

import { AppError } from "../../utils/app-error";
import { createSaleFunction } from "../../functions/sales/create-sale-function";
import { appErrorSchema, zodErrorSchema } from "../../types/errors-types";
import type { FastifyInstance } from "fastify";

const saleCoreProperties = {
  customer: {
    type: "object",
    required: ["name", "email", "phone", "cpf"],
    properties: {
      name: { type: "string", description: "Nome completo do cliente." },
      email: { type: "string", description: "E-mail válido." },
      phone: { type: "string", pattern: "^\\d{11}$", description: "Telefone." },
      cpf: { type: "string", pattern: "^\\d{11}$", description: "CPF." }, // CORRIGIDO PARA USAR PATTERN
    },
  },
  course: {
    type: "object",
    required: ["type", "name", "price"],
    properties: {
      course_type: {
        type: "string",
        enum: ["presencial", "online"],
        description: "Tipo de curso.",
      },
      name: { type: "string", description: "Nome do curso." },
      price: { type: "number", minimum: 0, description: "Valor original do curso." },
    },
  },
  discount: { type: "number", minimum: 0, description: "Valor do desconto." },
  taxes: { type: "number", minimum: 0, description: "Valor dos impostos." },
  commissions: { type: "number", minimum: 0, description: "Valor das comissões." },
  cardFees: { type: "number", minimum: 0, description: "Valor das taxas de cartão." },
  finalPrice: { type: "number", minimum: 0, description: "Preço final." },
};

const createSaleRouteSchema = {
  tags: ["Vendas"],
  summary: "Cria um novo registro de venda para um usuário autenticado.",
  description: "Registra uma nova transação de venda com detalhes do cliente e do curso.",

  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: Object.keys(saleCoreProperties), // Pega as chaves de saleCoreProperties
    properties: saleCoreProperties,
  },

  response: {
    201: {
      description: "Venda criada com sucesso",
      type: "object",
      required: ["message", "createdSale"], // Adicionar 'required' aqui
      properties: {
        message: { type: "string", example: "Venda criada com sucesso" },
        createdSale: {
          type: "object",
          required: Object.keys(saleCoreProperties),
          properties: {
            id: { type: "string", format: "uuid" }, // ✨ ADICIONAR
            created_by: { type: "string", format: "uuid" }, // ✨ ADICIONAR
            ...saleCoreProperties,
          },
        },
      },
    }, // Resposta para Erro de Validação Zod (400)

    400: {
      description: "Dados de entrada em formato inválido",
      type: "object",
      properties: {
        message: { type: "string", example: "Dados de entrada em formato inválido" },
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
      description: "Usuário não encontrado ou recurso não encontrado.",
      type: "object",
      properties: {
        message: { type: "string", example: "Usuário não encontrado." },
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

export async function createSaleRoute(app: FastifyInstance) {
  app.post(
    "/create_sale",
    {
      preHandler: [app.authenticate],
      schema: createSaleRouteSchema,
    },
    async (request, reply) => {
      try {
        const userId = userIdSchema.parse((request.user as any).id);
        const { customer, course, discount, taxes, commissions, cardFees, finalPrice } =
          bodySchema.parse(request.body);

        const result = await createSaleFunction({
          userId,
          customer,
          course,
          discount,
          taxes,
          commissions,
          cardFees,
          finalPrice,
        });

        const mappedSale = {
          id: result.id,
          created_by: userId,
          // Mapeamento dos campos complexos (Customer)
          customer: {
            name: result.client_name,
            email: result.client_email,
            phone: result.client_phone,
            cpf: result.cpf,
          },
          // Mapeamento dos campos complexos (Course)
          course: {
            // Note que no Schema você usou 'course_type', mas no body Zod usou 'type'
            // Aqui usamos o campo que foi armazenado no banco (assumindo 'course_type')
            type: result.course_type,
            name: result.course,
            // Converte o Decimal (se for o caso) para Number ou String
            price: Number(result.course_value),
          },
          // Mapeamento dos campos numéricos
          discount: Number(result.discount_value),
          taxes: Number(result.taxes_value),
          commissions: Number(result.commission_value),
          cardFees: Number(result.card_fee_value),
          finalPrice: Number(result.total_value),
        };
        console.log("MappedSaleId: " + mappedSale.id);

        return reply.status(201).send({
          message: "Venda criada com sucesso",
          createdSale: mappedSale,
        });
      } catch (error) {
        app.log.error(error, "Erro ao tentar criar venda no DB");
        if (error instanceof AppError) {
          type AppErrorStatusCode = 404 | 201 | 400 | 401 | 500;

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
