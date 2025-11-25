import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
export async function deleteDiscordUserInfosFunction(userId: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) throw new AppError("Usuário não encontrado", 400);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        discordId: null,
        discordName: null,
      },
    });

    return updatedUser;
  } catch (error: any) {
    throw new AppError(error, 400);
  }
}
