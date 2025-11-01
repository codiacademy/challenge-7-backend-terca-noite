import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './config/env.ts';
import { swaggerConfi } from './config/swagger.ts';
import { authRoutes } from './routes/auth.routes.ts';
import { usersRoutes } from './routes/users.routes.ts';
import { CreateUserRoute } from './routes/users/create-user-route.ts';
export const app = Fastify({ logger: true});

await swaggerConfi(app);


app.register(cors,{origin:"*"});
app.register(jwt,{secret:env.JWT_SECRET});

app.register(CreateUserRoute, { prefix: '/users' });
app.get('/', async (request, reply) => {
    return 'Codi Cash API rodando! Acesse /docs para a documentação.';
  });
  