
import {AppError} from "../../utils/app-error.ts"
import {prisma} from "../../lib/prisma.ts"

export async function deleteUserFunction(userId:string){
    try{
        const existingUser = await prisma.user.findUnique({
            where:{id: userId},
        });
        if (!existingUser){
            throw new AppError("Id de usuário não cadastrada!")
        }
        const deletedUser = prisma.user.delete({
            where:{id: userId}
        })

        return deletedUser;

    } catch(error){
        if (error instanceof AppError)
        {
            throw error
        }
        console.error("Erro operacional ao deletar usuário ", error)
        throw new AppError("Ocorreu um erro interno ao processar sua solicitação", 500)
    }
}