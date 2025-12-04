import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error";
import { isDiscordLinkedFunction } from "../../functions/users/is-discord-linked-function";

export async function getDiscordLinkedRoute(app: FastifyInstance) {
  app.get("/get_discord_linked", { preHandler: [app.authenticate] }, async (request, reply) => {
    try {
      const { id: userId } = request.user as any;
      const isDiscordLinked = await isDiscordLinkedFunction(userId);
      return reply
        .status(200)
        .send({ message: "Informação de link com DiscordObtida", isDiscordLinked });
    } catch (error: any) {
      app.log.error("Erro ao pegar informação de link com Discord", error);
      throw new AppError("Erro ao pegar informação de link com Discord", 500);
    }
  });
}
