# Challenge - Projeto Codi Cash (Back-end)

Período do Challenge: 27/10/2025 a 05/12/2025  
Repositório base: codiacademy/ChallengeVII-intensivo-ufjf

Este documento descreve o desafio de backend para o projeto "Codi Cash", dando continuidade ao trabalho de frontend já realizado. O objetivo é criar uma API completa, segura e testada que suporte o frontend existente e futuras integrações.

---

## 1. Visão Geral

O Codi Cash é um sistema de gestão financeira para as unidades da Codi Academy. O backend deve expor APIs REST (ou GraphQL, opcional) para gerenciar vendas, despesas, usuários, unidades e gerar indicadores financeiros usados pelo frontend (dashboards, gráficos, KPIs).

Principais responsabilidades do backend:

- Persistência de dados (banco relacional recomendado)
- Autenticação e autorização
- Validações e regras de negócio (ex.: cálculo de imposto/comissão/valor final)
- Endpoints para relatórios e agregações (KPIs)
- Documentação da API (OpenAPI/Swagger / Postman)
- Testes automatizados e CI
- Containerização e instruções de deploy

---

## 2. Tecnologias recomendadas

- Linguagem: TypeScript (recomendado) ou JavaScript
- Runtime / Framework: Node.js com Express, Fastify ou NestJS (NestJS recomendado para estrutura)
- Banco de dados: PostgreSQL (ou MySQL)
- ORM: Prisma ou Drizzle (Prisma recomendado pela DX)
- Autenticação: JWT (access + refresh tokens)
- Documentação: OpenAPI (Swagger)
- Testes: Vitest + Supertest
- Contêiner: Docker + docker-compose

---

## 3. Escopo do Back-end (mínimo exigido)

- Autenticação: login, refresh token, logout, roles (admin, manager, accountant)
- CRUD de Unidades (Codi Academy units)
- CRUD de Vendas
- CRUD de Despesas (fixas e variáveis) com categorias
- Endpoints filtráveis/pagináveis para lists (período, tipo curso, unidade, categoria)
- Endpoints de relatórios/indicadores:
  - Resumo mensal (receitas, despesas, saldo)
  - Séries temporais para gráficos (por dia/semana/mês)
  - Distribuição de gastos (por categoria) para gráfico de pizza
  - KPIs: total vendas, total despesas, margem
- Integração compatível com frontend existente (CORS, versionamento API)

---

## 4. Modelo de Dados (exemplo simplificado)

- users
  - id, name, email, password_hash, role, unit_id, created_at, updated_at
- units
  - id, name, address, created_at, updated_at
- sales
  - id, unit_id, course_type ("online" | "presencial"), client_name, client_email, client_phone, gross_value, discount, taxes, commissions, card_fees, net_value, date, created_by, created_at, updated_at
- expenses
  - id, unit_id, category_id, type ("fixa" | "variavel"), description, amount, date, recurring (boolean), created_by, created_at, updated_at
- categories
  - id, name, type ("fixa" | "variavel"), created_at
- migrations, audit logs (opcional), attachments (opcional)

Exemplo ER simplificado (descrito):

- Unit 1:N Sales
- Unit 1:N Expenses
- Category 1:N Expenses
- User N:1 Unit

---

## 5. Endpoints sugeridos (REST)

Autenticação:

- POST /api/v1/auth/login
  - body: { email, password }
  - response: { accessToken, refreshToken, user }
- POST /api/v1/auth/refresh
  - body: { refreshToken }
- POST /api/v1/auth/logout
  - body: { refreshToken }

Users / Units:

- GET /api/v1/units
- POST /api/v1/units
- GET /api/v1/units/:id
- PUT /api/v1/units/:id
- DELETE /api/v1/units/:id

Sales:

- GET /api/v1/sales?unitId=&from=&to=&courseType=&page=&limit=
- POST /api/v1/sales
- GET /api/v1/sales/:id
- PUT /api/v1/sales/:id
- DELETE /api/v1/sales/:id

Expenses:

- GET /api/v1/expenses?unitId=&from=&to=&category=&page=&limit=
- POST /api/v1/expenses
- GET /api/v1/expenses/:id
- PUT /api/v1/expenses/:id
- DELETE /api/v1/expenses/:id

Categories:

- GET /api/v1/categories
- POST /api/v1/categories
- PUT /api/v1/categories/:id
- DELETE /api/v1/categories/:id

Reports / Dashboards:

- GET /api/v1/reports/summary?unitId=&from=&to=
  - response: { totalRevenue, totalExpenses, netBalance, totalSalesCount }
- GET /api/v1/reports/series?unitId=&from=&to&period=daily|weekly|monthly
  - response: [{ date, revenue, expenses, net }]
- GET /api/v1/reports/expenses-distribution?unitId=&from=&to
  - response: [{ category, amount, percentage }]
- GET /api/v1/reports/sales?unitId=&from=&to&groupBy=courseType|day|month

Observações:

- Todos os endpoints protegidos devem exigir Authorization: Bearer <token>.
- Padrão de versão: /api/v1/ para permitir evolução.

---

## 6. Exemplos de payloads

Criar venda (POST /api/v1/sales):

```json
{
  "unitId": "uuid-do-unidade",
  "courseType": "online",
  "client": {
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+55 31 99999-9999"
  },
  "grossValue": 1000.0,
  "discount": 50.0,
  "taxes": 60.0,
  "commissions": 80.0,
  "cardFees": 20.0,
  "date": "2025-06-15T10:30:00Z"
}
```

Resposta (201):

```json
{
  "id": "uuid-venda",
  "unitId": "uuid-do-unidade",
  "courseType": "online",
  "clientName": "João Silva",
  "grossValue": 1000.0,
  "discount": 50.0,
  "taxes": 60.0,
  "commissions": 80.0,
  "cardFees": 20.0,
  "netValue": 790.0,
  "date": "2025-06-15T10:30:00Z",
  "createdAt": "2025-06-15T10:30:01Z"
}
```

---

## 7. Regras de negócio importantes

- netValue = grossValue - discount - taxes - commissions - cardFees
- Impostos e comissões devem aceitar valores absolutos e/ou percentuais (ex.: 5% do valor bruto)
- Vendas podem pertencer a uma unidade; se multi-tenant, aplicar isolamento por unitId
- Despesas fixas podem ser agendadas como recorrentes

---

## 8. Validação e tratamento de erros

- Sempre retornar status HTTP adequados (200/201/204/400/401/403/404/422/500)
- Erros de validação -> 400/422 com body explicando campos inválidos
- Erros de auth -> 401 / 403
- Todos os endpoints devem validar schema do body (zod, Joi, class-validator)
- Mensagens de erro amigáveis para o frontend

---

## 9. Segurança

- Passwords armazenados com bcryptjs
- Tokens JWT com expiração curta + refresh tokens
- CORS configurado permitindo apenas domínios do frontend (ou dev)
- Proteção contra SQL Injection (usar ORM + query parametrizada)
- Logs de autenticação e auditoria (login, logout, ações CRUD importantes) (opcional)

---

## 10. Testes

- Cobertura mínima recomendada: testes unitários + integração (fluxos críticos)
  - Testes para: autenticação, criação/edição/exclusão de sales e expenses, relatório de resumo
- Ferramentas: Vitest + Supertest para testes de endpoints
- Incluir scripts npm: test

## 11. Containerização / Rodando localmente

Arquivos sugeridos no repo:

- docker-compose.yml (Postgres + app + adminer)
- .env.example

Exemplo .env.example:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:password@db:5432/codicash
JWT_SECRET=trocar_por_segredo_super_secreto
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Comandos:

- docker-compose up --build
- npm run migrate
- npm run seed
- npm run start:dev

---

## 12. Documentação da API

- Gerar OpenAPI/Swagger e expor em /api/v1/docs (apenas em dev ou protegida)
- Incluir roteiro de integração para o frontend com endpoints e exemplos de chamadas

---

## 13. Dados de seed (sugestões)

- 2 unidades (Unidade Belo Horizonte, Unidade São Paulo)
- 3 usuários: admin, manager BH, accountant SP
- 10 vendas e 10 despesas para cada unidade cobrindo vários meses (usar para gráficos)

---

## 14. Critérios de Avaliação (back-end)

- Funcionalidade: endpoints implementados e funcionando conforme especificação
- Qualidade do código: organização, modularidade, padrões (TS, lint)
- Testes: cobertura e qualidade dos testes (caminhos felizes e edge-cases)
- Documentação: README, instruções de setup
- Segurança: autenticação, validação, proteção básica
- Integração: facilidade de consumo pela interface frontend (CORS, exemplos)
- Deploy: aplicação dockerizada e deploy simples (opcional: link do deploy)

---

## 15. Entregáveis obrigatórios

- Código-fonte em repositório GitHub (branch principal com README)
- README com instruções para rodar localmente e variáveis de ambiente
- OpenAPI/Swagger
- Migrations + seeds
- Testes executáveis via CI
- Dockerfile + docker-compose.yml
- Link do deploy (opcional, mas pontuado)

---

## 16. Cronograma / Milestones sugeridos

- Semana 1 (bootstrapping): Inicialização do projeto, arquitetura, autenticação, models básicos
- Semana 2: Endpoints de Units e Users; autenticação completa; seed de dados
- Semana 3: Implementar Sales CRUD + validações; testes básicos
- Semana 4: Implementar Expenses CRUD + categorias; testes
- Semana 5: Endpoints de Reports (resumo, series, distribuição) + performance (indices, queries otimizadas)
- Semana 6: Documentação, OpenAPI, Postman, docker, CI, correções finais e apresentação

---

## 17. Extras / Bônus (para nota adicional)

- Relatórios agendados (background jobs) e endpoints para export CSV/PDF
- Implementar cache para relatórios pesados (Redis)
- Webhooks para notificações (ex.: quando despesa recorrente é gerada)

---

## 18. Checklist de aceitação (mínimos)

- [ ] Autenticação funcionando (login/refresh/logout)
- [ ] CRUD de vendas e despesas implementados e testados
- [ ] Endpoints de relatório para dashboard funcionando
- [ ] OpenAPI e Swagger collection disponível
- [ ] README com setup (docker, migrations, seed)
- [ ] GitHub Actions rodando testes no PR
- [ ] Deploy básico/containers funcionando
