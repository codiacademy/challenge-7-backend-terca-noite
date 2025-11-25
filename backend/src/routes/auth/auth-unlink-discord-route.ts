import type { FastifyInstance } from "fastify";
import { AppError } from "../../utils/app-error.ts";
import { deleteDiscordUserInfosFunction } from "../../functions/users/delete-discord-user-infos-function.ts";

export async function authUnlinkDiscordRoute(app: FastifyInstance) {
  app.post("/discord/unlink", { preHandler: [app.authenticate] }, async (request, reply) => {
    const { id: userId } = request.user as any;

    try {
      const updatedUser = await deleteDiscordUserInfosFunction(userId);
      // Você pode retornar algo para o front como confirmação
      return reply
        .status(200)
        .send({ success: true, message: "Discord desvinculado com sucesso", updatedUser });
    } catch (err: any) {
      app.log.error("Erro ao desvincular Discord", err);
      throw new AppError("Erro ao desvincular Discord", 500);
    }
  });
}
