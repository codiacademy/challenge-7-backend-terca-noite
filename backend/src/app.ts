import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './config/env.ts';
import { swaggerConfi } from './config/swagger.ts';
import { createUserRoute } from './routes/users/create-user-route.ts';
import { deleteUserRoute } from './routes/users/delete-user-route.ts';
import { authLoginRoute } from './routes/auth/auth-login-route.ts';

export const app = Fastify({ logger: true});

await swaggerConfi(app);


app.register(cors,{origin:"*"});
app.register(jwt,{secret:env.JWT_SECRET});

app.register(createUserRoute, { prefix: '/users' });
app.register(deleteUserRoute,{ prefix: '/users' });
app.register(authLoginRoute);
app.get('/', async (request, reply) => {
    return 'Codi Cash API rodando! Acesse /docs para a documentação.';
  });
  