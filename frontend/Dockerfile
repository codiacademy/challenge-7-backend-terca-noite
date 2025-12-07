# 1. Fase de Build (usa Node para compilar o React/Vite)
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Comando de Build para o Vite
RUN npm run build

# --- FIM DA FASE BUILD ---

# 2. Fase de Produção (Servir arquivos estáticos com Nginx)
FROM nginx:alpine AS production

# Copia os arquivos estáticos gerados (dist) para o diretório padrão do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# A porta padrão do Nginx é 80
EXPOSE 80