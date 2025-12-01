#!/bin/sh
# 1. Espera o banco de dados estar pronto (opcional, mas recomendado)
# Pode ser necessário se o seu PostgreSQL demora a inicializar
# Enquanto o banco não aceitar conexões, o script espera.
echo "Aguardando o PostgreSQL..."
/usr/local/bin/wait-for-it db:5432 --timeout=30 echo "PostgreSQL está pronto!"

# 2. Aplica as migrações (Cria o esquema no DB)
echo "Aplicando migrações do Prisma..."
npx prisma generate 
# O "migrate deploy" é o ideal para produção/CI, pois aplica as migrações existentes.
npx prisma migrate deploy --preview-feature

# entrypoint.sh (Linha Final)
npm run start:prod 
# onde "start:prod" em package.json é geralmente "node dist/server.js"