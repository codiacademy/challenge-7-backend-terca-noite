import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      name: string;
      type: "access" | "refresh";
      iat?: number;
      exp?: number;
    };
  }
}
