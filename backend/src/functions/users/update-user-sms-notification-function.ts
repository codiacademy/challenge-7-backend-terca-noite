import { prisma } from "../../lib/prisma.ts";
import { AppError } from "../../utils/app-error.ts";


export async function updateUserSmsNotificationFunction({ userId }: { userId: string }) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { smsNotifications: true }
        });
        if (!existingUser) {
            throw new AppError("Usuário não encontrado", 404);
        }
        const user = await prisma.user.update({
            where: { id: userId },
            data: { smsNotifications: !existingUser.smsNotifications },
        });
        return user;
    } catch (error) {
        throw new AppError("Erro ao buscar usuário", 500);
    }
}