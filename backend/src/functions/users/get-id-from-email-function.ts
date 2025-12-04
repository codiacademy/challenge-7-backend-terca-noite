import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function getIdFromEmailFunction(email: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!existingUser) throw new AppError("Usuário não encontrado", 400);
    return existingUser.id;
  } catch (error: any) {
    throw new AppError(error, 400);
  }
}
