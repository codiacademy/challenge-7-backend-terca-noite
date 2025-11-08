import { prisma } from "../../lib/prisma.ts";
import { generateOtpCode, hashOtp } from "../../utils/otp-service.ts";
import { sendOtpEmail } from "../../utils/mail-service.ts";
import { AppError } from "../../utils/app-error.ts";
export async function twoFactorSendFunction(userId: string) {
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) throw new AppError("Usuário não encontrado", 403);

  const code = generateOtpCode();
  const codeHash = await hashOtp(code);

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

  const createdTwoFactorRequest = await prisma.twoFactorRequest.create({
    data: {
      userId,
      codeHash,
      expiresAt,
    },
  });
  await sendOtpEmail(existingUser.email, code);
  return createdTwoFactorRequest;
}
