# Imagem base com Node.js
FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copia os arquivos de configuração
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Gera o build do TypeScript (se aplicável)
RUN npm run build

# Expõe a porta da aplicação
EXPOSE 3000

# Comando de inicialização
CMD ["npm", "run", "start:prod"]
