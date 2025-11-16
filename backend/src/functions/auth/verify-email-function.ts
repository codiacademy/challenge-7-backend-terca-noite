import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";

export async function verifyEmailFunction(email: string) {
  try {
    const existingUser = prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) throw new AppError("Usuário não encontrado", 400);
    return existingUser;
  } catch (error) {}
}
