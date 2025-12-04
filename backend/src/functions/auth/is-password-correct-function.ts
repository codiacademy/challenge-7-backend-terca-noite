import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { compareOtp } from "../../utils/otp-service";
export async function isPasswordCorrectFunction({
  password,
  userId,
}: {
  password: string;
  userId: string;
}) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { password_hash: true },
    });
    if (!existingUser) {
      throw new AppError("Usuário não encontrado", 404);
    }
    const isPasswordCorrect = compareOtp(password, existingUser.password_hash);
    return isPasswordCorrect;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
  }
}
