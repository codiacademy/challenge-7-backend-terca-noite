import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function verifyEmailFunction(email: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) throw new AppError("Usuário não encontrado", 404);
  return existingUser;
}
