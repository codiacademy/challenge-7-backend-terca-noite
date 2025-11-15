import type { LoginUserType } from "../../types/users/user-types.ts";
import type { FastifyInstance } from "fastify";
import type { FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";
import bcrypt from "bcrypt";
import { generateTokens } from "../../utils/tokens-service.ts";
import { access } from "fs";
import { REPL_MODE_SLOPPY } from "repl";

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
        password_hash: true,
        name: true,
        two_factor_enabled: true,
      },
    });

    if (!existingUser) {
      throw new AppError("O e-mail não está cadastrado!", 404);
    }

    const isPasswordMatch = await bcrypt.compare(password, existingUser.password_hash);

    if (!isPasswordMatch) {
      throw new AppError("A senha está incorreta!", 401);
    }

    const tokens = await generateTokens(fastify, {
      userId: existingUser.id,
      email: existingUser.email,
      name: existingUser.name ?? "",
    });

    const { password_hash, ...user } = existingUser;

    return {
      user,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error("Erro interno ao fazer login:", error);

    throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500);
  }
}
