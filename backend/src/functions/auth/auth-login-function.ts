import type { LoginUserType } from "../../types/users/user-types.ts";
import type { FastifyInstance } from "fastify";
import type { FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
import bcrypt from "bcrypt";
import { generateTokens } from "../../utils/generate-tokens.ts";
import { access } from "fs";

export async function authLoginFunction(
  fastify: FastifyInstance,
  { email, password }: LoginUserType,
) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
      },
    });

    if (!existingUser) {
      throw new AppError("O e-mail não está cadastrado!", 404);
    }

    const isPasswordMatch = await bcrypt.compare(password, existingUser.passwordHash);
    if (!isPasswordMatch) {
      throw new AppError("A senha está incorreta!", 401);
    }

    const tokens = generateTokens(fastify, {
      userId: existingUser.id,
      email: existingUser.email,
      name: existingUser.name ?? "",
    });

    const { passwordHash, ...user } = existingUser;
    return {
      user: user,
      refreshToken: (await tokens).refreshToken,
      accessToken: (await tokens).accessToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Erro operacional ao deletar usuário ", error);
    throw new AppError("Ocorreu um erro interno ao processor sua solicitação", 500);
  }
}
