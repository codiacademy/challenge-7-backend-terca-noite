import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import type { CreateUserType } from "../../types/users/user-types.ts";

type OptionalCreateUserType = Partial<CreateUserType>;
export async function createTestUser2FA({
  fullName = "Mary Joe",
  email = "mary.joe@gmail.com",
  telephone = "32997667943",
  password = "12345678",
}: OptionalCreateUserType = {}) {
  const existingUser = await prisma.user.findUnique({
    where: { email: email },
  });
  if (existingUser) {
    return existingUser;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const createdUser = await prisma.user.create({
    data: {
      name: fullName,
      email,
      telephone,
      password_hash: passwordHash,
      two_factor_enabled: true,
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
