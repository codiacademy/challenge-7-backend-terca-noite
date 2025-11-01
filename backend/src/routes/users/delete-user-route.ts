import {z} from 'zod';
import type{ FastifyInstance } from 'fastify';
import {AppError} from '../../utils/app-error.ts';
import {deleteUserFunction} from '../../functions/users/delete-user-function.ts'

const paramsSchema = z.object({
    id: z.string()
})

export async function deleteUserRoute(app:FastifyInstance){
    app.delete('/delete_user/:id', async(request,reply) => {
        const { id } = paramsSchema.parse(request.params);

        try{
            const result = await deleteUserFunction({id});

            return reply.status(201).send({
                message: "Usuário deletado com sucesso",
                user: result
            })
        } catch(error){
            app.log.error(error, "Erro ao tentar deletar usuário no DB");
            if (error instanceof AppError) {
                return reply.status(error.statusCode).send({
                    message: error.message,
                    code: error.statusCode
                })
            }
            if( error instanceof z.ZodError){
                return reply.status(400).send({
                    message: "ID em formato inválidos",
                    errors: error.issues, // Retorna erros por campo
                });
            }

            return reply.status(500).send({
                message: "Erro interno do servidor. Tente novamente mais tarde.",
            });

        }
    })
}