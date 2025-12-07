type DiscordInfo = {
  userId: string;
  discordId: string;
  username: string;
  discriminator: string;
};
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
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
