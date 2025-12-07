import type { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

export async function swaggerConfi(app: FastifyInstance) {
  // Registro do Swagger (documentação da API)

  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: "Codi Cash API",
        description: "Documentação da API do projeto Codi Cash",
        version: "1.0.0",
      },
      servers: [{ url: "http://localhost:3000", description: "Servidor local" }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });

  await app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "none",
      deepLinking: false,
    },
  });
}
