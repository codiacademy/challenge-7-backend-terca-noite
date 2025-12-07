import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// 🚨 Importação corrigida para compatibilidade com ESM/CJS
import pg from "pg";
const { Pool } = pg;

// 2. Criar a pool (driver) e o adaptador
// Certifique-se de que a variável de ambiente DATABASE_URL está carregada
const connectionString = process.env.DATABASE_URL as string;

// A propriedade 'connectionString' é o mínimo, pode precisar de mais opções dependendo do seu banco.
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// 3. Passar o adaptador para o PrismaClient
export const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});
