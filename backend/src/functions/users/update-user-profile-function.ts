import type { ProfileChangeType } from '../../types/users/user-types.ts'
import { prisma } from "../../lib/prisma.ts"
import { AppError } from "../../utils/app-error.ts"

export async function updateUserProfileFunction({ userId, name, email }: ProfileChangeType) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        })
        if (!existingUser) {
            throw new AppError("Usuário não encontrado", 404);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
            },
            select: {
                name:true,
                email:true,
            }
        });
        return updatedUser;
    } catch (error) {
        if (error instanceof AppError)
        {
            throw error
        }
        console.error("Erro operacional ao deletar usuário ", error)
        throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500)
    }
}