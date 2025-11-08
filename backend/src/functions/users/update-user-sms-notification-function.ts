import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";

export async function updateUserSmsNotificationFunction({ userId }: { userId: string }) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { notification_sms_enabled: true },
    });
    if (!existingUser) {
      throw new AppError("Usuário não encontrado", 404);
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { notification_sms_enabled: !existingUser.notification_sms_enabled },
    });
    return user;
  } catch (error) {
    throw new AppError("Erro ao buscar usuário", 500);
  }
}
