type DiscordInfo = {
  userId: string;
  discordId: string;
  username: string;
  discriminator: string;
};
import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
export async function updateDiscordUserInfos({
  userId,
  discordId,
  username,
  discriminator,
}: DiscordInfo) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) throw new AppError("Usuário não encontrado", 400);

    const discordFullName = `${username}#${discriminator}`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        discordId,
        discordName: discordFullName,
      },
    });

    return updatedUser;
  } catch (error: any) {
    throw new AppError(error, 400);
  }
}
