import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function getNameFromEmailFunction(email: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { name: true },
    });

    if (!existingUser) throw new AppError("Usuário não encontrado", 400);
    return existingUser.name;
  } catch (error: any) {
    throw new AppError(error, 400);
  }
}
