import type {FastifyInstance} from 'fastify';
import {AppError} from '../../utils/app-error.ts';
import {authLoginFunction} from '../../functions/auth/auth-login-function.ts';
import {z} from 'zod';

const bodySchema = z.object({
    email: z.email(),
    password: z.string()

})
export async function authLoginRoute(app:FastifyInstance){
    app.post('/login', async(request,reply) => {
        try{
            const {email, password} = bodySchema.parse(request.body)

            const result = await authLoginFunction({email,password});

            return reply.status(200).send({
                message: "Login bem-sucedido",
                token: result.token,
            });
        } catch (error){
            app.log.error(error, "Erro ao tentar criar usuário no DB");
                if (error instanceof AppError) {
                    return reply.status(error.statusCode).send({
                        message: error.message,
                        code: error.statusCode
                    })
                }
                if( error instanceof z.ZodError){
                    return reply.status(400).send({
                        message: "Dados de entrada em formato inválido",
                        errors: error.issues, // Retorna erros por campo
                    });
                }

                return reply.status(500).send({
                    message: "Erro interno do servidor. Tente novamente mais tarde.",
                });
        }
        
    })
}