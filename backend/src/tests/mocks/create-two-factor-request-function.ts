import { prisma } from "../../lib/prisma";
import { generateOtpCode, hashOtp } from "../../utils/otp-service";
import { sendOtpEmail } from "../../utils/mail-service";
import { AppError } from "../../utils/app-error";
export async function createTwoFactorRequestFunction(userId: string) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) throw new AppError("Usuário não encontrado", 403);

  const code = await generateOtpCode();
  const codeHash = await hashOtp(code);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  const createdTwoFactorRequest = await prisma.twoFactorRequest.create({
    data: {
      userId,
      codeHash,
      expiresAt,
    },
  });
  return { createdTwoFactorRequest, code };
}
