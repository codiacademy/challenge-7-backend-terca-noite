import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function readUserProfileFunction(userId: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        telephone: true,
        two_factor_enabled: true,
        notification_email_enabled: true,
        notification_discord_enabled: true,
      },
    });

    if (!existingUser) {
      throw new AppError("Usuário não encontrado!", 404);
    }
    return existingUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao ler perfil do usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
