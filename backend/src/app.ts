import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './config/env.js';
import { swaggerConfi } from './config/swagger.js';
import { authRoutes } from './routes/auth.routes.js';
import { usersRoutes } from './routes/users.routes.js';

export const app = Fastify({ logger: true});

await swaggerConfi(app);


app.register(cors,{origin:"*"});
app.register(jwt,{secret:env.JWT_SECRET});

app.register(authRoutes, { prefix: '/auth' });
app.register(usersRoutes, { prefix: '/users' });
app.get('/', async (request, reply) => {
    return 'Codi Cash API rodando! Acesse /docs para a documentação.';
  });
  