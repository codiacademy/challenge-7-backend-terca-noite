import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      email: string;
      name: string;
      type: "access" | "refresh" | "2fa_pending";
      iat?: number;
      exp?: number;
    };
  }
}
