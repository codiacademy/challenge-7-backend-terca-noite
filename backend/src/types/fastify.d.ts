import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: any;
    verifyRefreshToken: any;
  }
}
