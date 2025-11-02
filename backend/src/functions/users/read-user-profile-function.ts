import { prisma } from '../../lib/prisma.ts';
import { AppError } from "../../utils/app-error.ts";

export async function readUserProfileFunction(userId: string) {
    try{
        const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            two_factor_enabled: true,
            notification_email_enabled : true,
            notification_sms_enabled :true,
        }
    });

    if (!existingUser) {
        throw new AppError("Usuário não encontrado!", 404)
    }
    return existingUser;

    } catch(error){
        if (error instanceof AppError)
        {
            throw error
        }
        console.error("Erro operacional ao deletar usuário ", error)
        throw new AppError("Ocorreu um erro interno ao processor sua solicitação", 500)
    }
}