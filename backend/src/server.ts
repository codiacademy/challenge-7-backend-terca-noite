import { app } from './app.js';
import { env } from './config/env.js';

const  InitServer = async () => {
    try{
        await app.listen({ port: env.PORT, host: '0.0.0.0'});
        console.log(`Server inicializado e rodando com sucesso na porta ${env.PORT}`)
    } catch (err){
        app.log.error(err);
    }
}

InitServer();