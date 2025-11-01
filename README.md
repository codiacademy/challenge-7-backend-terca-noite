# Codi Cash - Sistema de Gestão Financeira

Sistema completo de gestão financeira para unidades da Codi Academy, composto por frontend (React + Vite) e backend (Node.js + Fastify).

## 📁 Estrutura do Projeto

```
challenge-7-backend-terca-noite/
├── backend/          # API REST em TypeScript
│   ├── src/          # Código fonte
│   ├── prisma/       # Schema e migrations do Prisma
│   ├── Dockerfile    # Container para backend
│   └── package.json
├── frontend/         # Aplicação React
│   ├── src/          # Código fonte
│   ├── public/       # Assets estáticos
│   ├── Dockerfile    # Container para frontend
│   └── package.json
├── docker-compose.yml  # Orquestração dos serviços
└── README.md
```

## 🚀 Tecnologias

### Backend
- **Runtime:** Node.js 20
- **Framework:** Fastify
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL 15
- **ORM:** Prisma
- **Autenticação:** JWT
- **Documentação:** Swagger/OpenAPI

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS
- **Estado:** React Hooks
- **Formulários:** React Hook Form + Yup
- **Gráficos:** Recharts

## 📋 Pré-requisitos

- [Node.js](https://nodejs.org/) 20 ou superior
- [PostgreSQL](https://www.postgresql.org/) 15+ (ou Docker para o banco)
- npm ou yarn

## 🔧 Instalação e Execução

### Opção 1: Desenvolvimento Local (Sem Docker) ⚡

**Rápido e recomendado para desenvolvimento:**

1. Clone o repositório:
```bash
git clone <repository-url>
cd challenge-7-backend-terca-noite
```

2. Configure o PostgreSQL:
   - Instale PostgreSQL localmente OU
   - Use Docker apenas para o banco: `docker-compose up db` (se Docker estiver disponível)

3. Configure as variáveis de ambiente no backend:
```bash
cd backend
copy ../.env.example .env
# Edite o .env e ajuste DATABASE_URL para: postgresql://postgres:postgres@localhost:5432/codi_db
```

4. Instale dependências do backend:
```bash
npm install
```

5. Execute migrations:
```bash
npm run prisma:migrate
npm run prisma:generate
```

6. Inicie o backend:
```bash
npm run dev
```

7. Em outro terminal, configure o frontend:
```bash
cd frontend
npm install
npm run dev
```

8. Acesse:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/docs

### Opção 2: Usando Docker (Produção/CI)

1. Clone o repositório:
```bash
git clone <repository-url>
cd challenge-7-backend-terca-noite
```

2. Crie um arquivo `.env` na raiz do projeto:
```env
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://postgres:postgres@db:5432/codi_db
```

3. Suba os containers:
```bash
docker-compose up -d --build
```

4. Execute as migrations do Prisma:
```bash
docker-compose exec backend npm run prisma:migrate
```

5. Gere o cliente Prisma:
```bash
docker-compose exec backend npm run prisma:generate
```

6. Acesse:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Swagger Docs:** http://localhost:3000/docs
- **PostgreSQL:** localhost:5432

### Desenvolvimento Local (Sem Docker)

#### Backend

1. Navegue até a pasta backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/codi_db
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

4. Execute as migrations:
```bash
npm run prisma:migrate
npm run prisma:generate
```

5. Inicie o servidor:
```bash
npm run dev
```

#### Frontend

1. Navegue até a pasta frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🧪 Testes

### Backend
```bash
cd backend
npm test
```

### Frontend
```bash
cd frontend
npm test
```

## 📚 Endpoints da API

### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Logout

### Usuários
- `GET /users` - Listar usuários
- `POST /users` - Criar usuário
- `GET /users/:id` - Buscar usuário
- `PUT /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Deletar usuário

### Unidades
- `GET /units` - Listar unidades
- `POST /units` - Criar unidade
- `GET /units/:id` - Buscar unidade
- `PUT /units/:id` - Atualizar unidade
- `DELETE /units/:id` - Deletar unidade

### Vendas
- `GET /sales` - Listar vendas (com filtros)
- `POST /sales` - Criar venda
- `GET /sales/:id` - Buscar venda
- `PUT /sales/:id` - Atualizar venda
- `DELETE /sales/:id` - Deletar venda

### Despesas
- `GET /expenses` - Listar despesas (com filtros)
- `POST /expenses` - Criar despesa
- `GET /expenses/:id` - Buscar despesa
- `PUT /expenses/:id` - Atualizar despesa
- `DELETE /expenses/:id` - Deletar despesa

### Relatórios
- `GET /reports/summary` - Resumo financeiro
- `GET /reports/series` - Séries temporais
- `GET /reports/expenses-distribution` - Distribuição de despesas

## 🔒 Segurança

- Autenticação via JWT
- Criptografia de senhas com bcrypt
- Validação de dados com Zod
- CORS configurado
- Proteção contra SQL Injection (via Prisma)

## 🤝 Contribuindo

1. Crie uma branch para sua feature
2. Faça commit das suas mudanças
3. Push para a branch
4. Abra um Pull Request

## 📝 Licença

Este projeto é parte do Challenge da Codi Academy.

## 👥 Autores

- Desenvolvido durante o Challenge da Codi Academy

## 📞 Suporte

Para questões e suporte, abra uma issue no repositório.
