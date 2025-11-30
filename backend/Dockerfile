# 1. Fase de Desenvolvimento/Build (usa Node mais completo)
FROM node:20-alpine AS builder

# Define o diretório de trabalho na imagem
WORKDIR /app

# Copia o package.json e o package-lock.json (ou yarn.lock)
# Isso permite que o cache do Docker funcione melhor
COPY package.json package-lock.json ./

# Instala as dependências (incluindo devDependencies para build/testes)
RUN npm install

# Copia o restante do código
COPY . .

# Comando de Testes (CRUCIAL para o CI)
# Se os testes falharem, o build do Docker falha
RUN npm run prisma:generate

RUN npm run test

# Comando de Build para compilar o TypeScript (gera a pasta 'dist')
RUN npm run build

# --- FIM DA FASE BUILD ---

# 2. Fase de Produção (Imagem final, leve e segura)
FROM node:20-alpine AS production

# Define o diretório de trabalho
WORKDIR /app

# Copia APENAS as dependências de produção
COPY package.json package-lock.json ./
# Instala as dependências de produção
RUN npm install --only=production --ignore-scripts

# Copia o código compilado da fase anterior (a pasta 'dist')
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma 
# Se você tiver um arquivo .env para produção, copie-o
# COPY .env.production .env

# O comando 'start:prod' é o que deve ser usado, pois não tem 'watch'
CMD [ "npm", "run", "start:prod" ]

# Porta que o Fastify deve expor
EXPOSE 3000