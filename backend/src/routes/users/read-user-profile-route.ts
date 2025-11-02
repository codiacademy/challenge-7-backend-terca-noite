import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { readUserProfileFunction } from '../../functions/users/read-user-profile-function.ts';
import { AppError } from '../../utils/app-error.ts';

const userIdSchema = z.uuid()

export async function readUserProfileRoute(app: FastifyInstance) {
    app.get('/read_profile',
        { preHandler: [app.authenticate] },
        async (request: any, reply) => {
            try {
                console.log("Payload do usuário:", request.user);
                const userId = userIdSchema.parse( (request.user as any).id);
                const userProfile = await readUserProfileFunction(userId);
                return reply.status(200).send({
                    message: "Perfil do usuário obtido com sucesso",
                    user: userProfile
                });

            } catch (error) {
                app.log.error(error, "Erro ao tentar deletar usuário no DB");
                if (error instanceof AppError) {
                    return reply.status(error.statusCode).send({
                        message: error.message,
                        code: error.statusCode
                    })
                }
                if (error instanceof z.ZodError) {
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