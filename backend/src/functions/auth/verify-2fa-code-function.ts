import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
import { compareOtp } from "../../utils/otp-service.ts";
export async function verify2faCodeFunction({ userId, code }: { userId: string; code: string }) {
  try {
    const record = await prisma.twoFactorRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (!record) throw new AppError("Código não encontrado", 400);
    if (record.expiresAt < new Date()) throw new AppError("Código expirado", 400);
    const match = await compareOtp(code, record.codeHash);
    if (!match) throw new AppError("Código inválido", 400);

    const updatedTwoFactorRequest = await prisma.twoFactorRequest.update({
      where: { id: record.id },
      data: { consumed: true },
    });

    return match;
  } catch (error) {
    throw error;
  }
}
