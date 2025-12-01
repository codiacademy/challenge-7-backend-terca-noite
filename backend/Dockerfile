# -----------------------------------------------------------
# FASE 1: BUILDER (Desenvolvimento e Compilação)
# -----------------------------------------------------------
FROM node:20-alpine AS builder

# Define o diretório de trabalho principal
WORKDIR /app

RUN apk add --no-cache dos2unix

# 1. Variáveis de Ambiente (ARG/ENV)
# Usadas para que o Prisma/Build/Testes possam rodar
ARG DATABASE_URL
ARG JWT_SECRET
ARG JWT_EXPIRES_IN
ARG JWT_REFRESH_SECRET
ARG JWT_REFRESH_EXPIRES_IN
ARG COOKIE_SECRET
ARG EMAIL_USER
ARG EMAIL_PASS
ARG DISCORD_CLIENT_ID
ARG DISCORD_CLIENT_SECRET
ARG DISCORD_REDIRECT_URI
ARG DISCORD_BOT_TOKEN
ARG DISCORD_TARGET_GUILD_ID
ARG BOT_REQUIRED_PERMISSIONS_INT
ARG NODE_ENV=test

ENV DATABASE_URL=${DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
ENV JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENV JWT_REFRESH_EXPIRES_IN=${JWT_REFRESH_EXPIRES_IN}
ENV COOKIE_SECRET=${COOKIE_SECRET}
ENV EMAIL_USER=${EMAIL_USER}
ENV EMAIL_PASS=${EMAIL_PASS}
ENV DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
ENV DISCORD_CLIENT_SECRET=${DISCORD_CLIENT_SECRET}
ENV DISCORD_REDIRECT_URI=${DISCORD_REDIRECT_URI}
ENV DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN}
ENV DISCORD_TARGET_GUILD_ID=${DISCORD_TARGET_GUILD_ID}
ENV BOT_REQUIRED_PERMISSIONS_INT=${BOT_REQUIRED_PERMISSIONS_INT}
ENV NODE_ENV=${NODE_ENV}


# 2. Instalação de Dependências e Utilidades
# Instala wait-for-it, essencial para o entrypoint.sh aguardar o DB
ADD https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh /usr/local/bin/wait-for-it
RUN chmod +x /usr/local/bin/wait-for-it

# Copia arquivos de dependência
COPY package.json package-lock.json ./

# Instala todas as dependências (incluindo devDependencies)
RUN npm install

# 3. Cópia do Código-Fonte
# Esta cópia deve ser feita APÓS o npm install para garantir a ordem correta
COPY . .

# Copia e configura o script de inicialização do runtime
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN dos2unix /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# 4. Geração de Arquivos Estáticos e Compilação
# Gera o Prisma Client (usa os arquivos de dependência)
RUN npm run prisma:generate

RUN mkdir -p dist # Cria a pasta se não existir

RUN npm run build

# -----------------------------------------------------------
# FASE 2: PRODUCTION (Imagem Final Leve)
# -----------------------------------------------------------
FROM node:20-alpine AS production

# Define o diretório de trabalho
WORKDIR /app

# 1. Cópia e Instalação de Dependências de Produção
COPY package.json package-lock.json ./
# Instala APENAS as dependências de produção
RUN npm install --only=production --ignore-scripts


# O Docker só consegue copiar se o diretório existir. 
COPY --from=builder /app/node_modules ./node_modules

# 2. Cópia de Assets Compilados (RESOLVENDO O ERRO DO 'dist')
RUN mkdir -p dist
COPY --from=builder /app/dist/ ./dist/

# Copia a pasta prisma (essencial para o ENTRYPOINT.SH rodar a migração)
COPY prisma ./prisma 

# Copia o script de entrada que fará a migração/teste
COPY --from=builder /usr/local/bin/entrypoint.sh /usr/local/bin/entrypoint.sh


# 3. Configuração de Runtime
# Define o ENTRYPOINT: Chamará o script que roda a migração, o teste e, por fim, a API.
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# CMD de fallback (será executado pelo entrypoint.sh)
CMD [ "npm", "run", "start:prod" ]

# Porta que o Fastify deve expor
EXPOSE 3000