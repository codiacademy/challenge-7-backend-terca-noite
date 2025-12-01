# 💸 Codi Cash — Sistema de Gestão Financeira (Frontend + API)

Sistema completo de controle financeiro desenvolvido para as unidades da **Codi Academy**, composto por:

- **Frontend Web** (React + Vite)
- **API Backend** (Fastify + Prisma + PostgreSQL)

O sistema permite cadastro e gestão de vendas, despesas, usuários, indicadores financeiros e integrações (Discord OAuth).

# 🧩 Estrutura do Projeto

`challenge-7-backend-terca-noite/  │── backend/      → API Fastify + Prisma + PostgreSQL  │── frontend/     → Interface Web React + Vite`

# ⚙️ Tecnologias do Backend (API)

- **Fastify** (servidor HTTP rápido e tipado)
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **Zod** (validação do schema de ambiente e inputs)
- **Vitest** (testes)
- **Supertest** (testes HTTP)
- **bcrypt** (hash de senha)
- **jsonwebtoken** (sessions e refresh tokens)
- **dotenv** (gestão de variáveis de ambiente)
- **nodemailer** (envio de emails — recuperação de senha)
- **tsx** (execução TS sem build)
- **Docker Compose** (banco de dados)
- **ESLint + Prettier**

# 💻 Tecnologias do Frontend

- **ReactJS**
- **TypeScript**
- **TailwindCSS**
- **Formik** + **Yup**
- **Framer Motion**
- **Lucide React**
- **React Router DOM**
- **Recharts**
- **React Toastify**
- **SweetAlert2**
- **Shadcn**
- **Vite**

# 📋 Funcionalidades Principais

### 🔹 **Frontend**

- Dashboard com KPIs, gráficos e resumo mensal
- CRUD de vendas
- CRUD de despesas
- Filtros avançados
- Modais, animações e UX aprimorada

### 🔹 **Backend**

- Autenticação JWT + Refresh Tokens
- Login via **Discord OAuth**
- CRUD de usuários
- CRUD de vendas
- CRUD de despesas
- Validação rigorosa com Zod
- Envio de emails (Nodemailer)
- Seed automático de dados
- Testes automatizados (Vitest + Supertest)
- Migrations e schema garantidos pelo Prisma

# 🧪 Testes (Backend)

Para rodar todos os testes do backend:

`npm run test`

Os testes utilizam:

- Vitest
- Supertest
- Ambiente .env.test carregado automaticamente

# 📦 Como Rodar o Projeto Localmente

## 1️⃣ Clonar o repositório

`git clone https://github.com/codiacademy/challenge-7-backend-terca-noite.git  cd challenge-7-backend-terca-noite`

# 🖥️ Rodando o FRONTEND

`cd frontend  npm install  npm run dev`

Acesse em:

👉 [http://localhost:5173](http://localhost:5173)

# 🛠️ Rodando o BACKEND

### 1\. Entre na pasta backend

`cd backend`

## 2\. Criar arquivos .env e .env.local

Copie **o conteúdo inteiro de .env.example** para **ambos**:

- .env
- .env.local

### No .env (modo Docker / servidor)

Não altere nada.

`DATABASE_URL="postgresql://codi_user:codi_password@db:5432/codi_db"`

### No .env.local (modo desenvolvimento local)

Troque db por localhost:

`DATABASE_URL="postgresql://codi_user:codi_password@localhost:5432/codi_db"`

O resto permanece igual.

## 3\. Subir o banco (Docker)

`docker compose up -d db`

Certifique-se que o container está rodando:

`docker ps`

## 4\. Gerar Prisma Client

`npm run prisma:generate`

## 5\. Aplicar migrations

`npm run prisma:migrate`

Isso criará as tabelas e deixará o schema sincronizado.

## 6\. Rodar a API

Modo local:

`npm run dev`

A rota base será:

👉 [http://localhost:3000](http://localhost:3000)

## 7\. Rodar testes (opcional)

`npm run test`

# 🗄️ Estrutura do Backend

`backend/  │── prisma/  │   ├── schema.prisma  │   ├── migrations/  │  │── src/  │   ├── server.ts  │   ├── env.ts  │   ├── routes/  │   ├── functions/  │   ├── utils/  │   ├── tests/  │  │── .env  │── .env.local  │── .env.example`

# 📑 Requisitos Atendidos

- CRUD completo de despesas e vendas
- Autenticação JWT segura
- Compatível com frontend Codi Cash
- Banco sincronizado com Prisma
- Testes automatizados
- Integração com Discord OAuth
- Validação forte com Zod
- Documentação e organização

# 📝 Licença

Projeto desenvolvido para fins educacionais no **Challenge VII — Codi Academy**.

# 👨‍💻 Autoria

Time original do frontend:

- [Cauan Lagrotta](https://www.linkedin.com/in/cauan-silva-lagrotta/)
- [Mariana Carminate](https://www.linkedin.com/in/mariana-santos-carminate-0a0893133/)
- [Fabiano Andrade](https://www.linkedin.com/in/fabiano-andrade-13118475/)
- [Pedro Claret](https://www.linkedin.com/in/pedroclaret/)

Time original do backend:

- [Bernardo Gará Perona](linkedin.com/in/bernardogaraperona?originalSubdomain=br)
- [Gabriel](https://www.linkedin.com/in/mariana-santos-carminate-0a0893133/)
- [Artur](https://www.linkedin.com/in/fabiano-andrade-13118475/)
- [Pedro Claret](https://www.linkedin.com/in/pedroclaret/)
