import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function isDiscordLinkedFunction(userId: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { discordId: true, discordName: true },
    });

    if (!existingUser) throw new AppError("Usuário não encontrado", 400);
    return existingUser.discordId ? true : false;
  } catch (error: any) {
    throw new AppError(error, 400);
  }
}
