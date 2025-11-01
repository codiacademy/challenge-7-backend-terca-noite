
import type {IdUserType} from '../../types/users/user-types.ts'
import {AppError} from "../../utils/app-error.ts"
import {prisma} from "../../lib/prisma.ts"

export async function deleteUserFunction({id}:IdUserType){
    try{
        const existingUser = await prisma.user.findUnique({
            where:{id},
        });
        if (!existingUser){
            throw new AppError("Id de usuário não cadastrada!")
        }
        const deletedUser = prisma.user.delete({
            where:{id}
        })

        return deletedUser;

    } catch(error){
        if (error instanceof AppError)
        {
            throw error
        }
        console.error("Erro operacional ao deletar usuário ", error)
        throw new AppError("Ocorreu um erro interno ao processor sua solicitação", 500)
    }
}