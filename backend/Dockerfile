# -----------------------------------------------------------
# FASE 1: BUILDER
# -----------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache dos2unix

ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/wait-for-it

# Instalar deps
ARG DATABASE_URL
# Converte o ARG em variável de ambiente
ENV DATABASE_URL=$DATABASE_URL

RUN echo "Database variable: $DATABASE_URL"

COPY package*.json .

RUN npm install

# Copia tudo
COPY . .

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN rm -f .env .env.local

RUN npx prisma generate

# Build final
RUN npm run build

# -----------------------------------------------------------
# FASE 2: PRODUCTION
# -----------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh

# Precisamos do DATABASE_URL no container final!!
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["npm", "run", "start:prod"]

EXPOSE 3000
