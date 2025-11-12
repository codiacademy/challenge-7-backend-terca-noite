import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
import { hash } from "bcrypt";

export async function updateUserPasswordFunction({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) {
  try {
    const existingUser = prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existingUser) {
      throw new AppError("Usuário não encontrado", 404);
    }

    const updatedHashPassword = await hash(newPassword, 10);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password_hash: updatedHashPassword },
    });
    return updatedUser;
  } catch (error) {}
}
