import { email } from "zod";
import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";

export async function updateUserEmailNotificationFunction({ userId }: { userId: string }) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { notification_email_enabled: true },
    });
    if (!existingUser) {
      throw new AppError("Usuário não encontrado", 404);
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: { notification_email_enabled: !existingUser.notification_email_enabled },
    });
    return user;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao atualizar a notificação por email do usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
