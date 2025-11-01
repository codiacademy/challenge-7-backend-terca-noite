import type { LoginUserType } from '../../types/users/user-types.ts'
import { prisma } from "../../lib/prisma.ts"
import { AppError } from '../../utils/app-error.ts'
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function authLoginFunction({ email, password }: LoginUserType) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                passwordHash: true,
            }
        },)

        if (!existingUser) {
            throw new AppError("O e-mail não está cadastrado!", 404)
        }

        const isPasswordMatch = await bcrypt.compare(password, existingUser.passwordHash)
        if (!isPasswordMatch) {
            throw new AppError("A senha está incorreta!", 401)
        }

        const token = jwt.sign(
            { id: existingUser.id, email: existingUser.email },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        )

        const { passwordHash, ...user} = existingUser;
        return {
            user: user,
            token
        }
            ;
    } catch (error) {
        if (error instanceof AppError) {
            throw error
        }
        console.error("Erro operacional ao deletar usuário ", error)
        throw new AppError("Ocorreu um erro interno ao processor sua solicitação", 500)

    }

}