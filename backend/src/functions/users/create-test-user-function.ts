import { prisma } from "../../lib/prisma.ts";
import bcrypt from "bcrypt";
import { AppError } from "../../utils/app-error.ts";

export async function createTestUser() {
  const testEmail = "john.doe@gmail.com";
  const testPassword = "1234";
  const testName = "John Doe";
  const testPhone = "32997667943";
  const existingUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  if (existingUser) {
    return existingUser;
  }
  const passwordHash = await bcrypt.hash(testPassword, 10);
  const createdUser = await prisma.user.create({
    data: {
      name: testName,
      email: testEmail,
      telephone: testPhone,
      password_hash: passwordHash,
    },
    // Adiciona a seleção para garantir que o hash da senha NUNCA saia
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true,
      updated_at: true,
    },
  });
  return createdUser;
}
