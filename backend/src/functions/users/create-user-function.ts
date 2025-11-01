import {prisma} from "../../lib/prisma.ts";
import type { CreateUserInput } from "../../types/users/user-types.ts";
import { AppError } from "../../utils/app-error.ts"

export async function createUserFunction({name,email,passwordHash}: CreateUserInput) {
    try{
        const existingUser = await prisma.user.findUnique({
            where:{email},
        });
        if (existingUser){
            throw new AppError("Este e-mail já está cadastrado", 409);
        }
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
            },
            // Adiciona a seleção para garantir que o hash da senha NUNCA saia
            select: {
                id: true,
                name: true,
                email: true,
                created_at: true,
                updated_at: true,
            }
        })
        return user;
    } catch (error) {
        if (error instanceof AppError)
        {
            throw error
        }
        console.error("Erro operacional ao criar usuário ", error)
        throw new AppError("Ocorreu um erro interno ao processor sua solicitação", 500)

    }
}