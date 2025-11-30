import { prisma } from "../../lib/prisma.ts";
import type { CreateUserType } from "../../types/users/user-types.ts";
import { AppError } from "../../utils/app-error.ts";
import bcrypt from "bcrypt";

export async function createUserFunction({ fullName, email, telephone, password }: CreateUserType) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    console.log("Usuário procurado!");
    if (existingUser) {
      console.log("Usuário já cadastrado!");
      throw new AppError("Este e-mail já está cadastrado", 409);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    console.log("Usuário com nova senha criptografada!");
    const createdUser = await prisma.user.create({
      data: {
        name: fullName,
        email,
        telephone: telephone ?? null,
        password_hash: passwordHash,
      },
      // Adiciona a seleção para garantir que o hash da senha NUNCA saia
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        updated_at: true,
        telephone: true,
      },
    });
    console.log("Usuário criado");

    return createdUser;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao criar usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
