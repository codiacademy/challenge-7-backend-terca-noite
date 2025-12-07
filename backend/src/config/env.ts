import { z } from "zod";

import dotenv from "dotenv";

const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "development"
      ? ".env.local"
      : ".env";

dotenv.config({ path: envFile });

console.log("🔧 ENV carregado:", envFile); // Debug úti

export const envSchema = z.object({
  // --------------------------
  // CORE
  // --------------------------
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL deve ser uma URL válida")
    .min(10, "DATABASE_URL é muito curta"),

  PORT: z
    .string()
    .transform(Number)
    .refine((v) => v > 0 && v < 65535, "PORT deve ser um número entre 1 e 65535"),

  NODE_ENV: z
    .string()
    .trim()
    .pipe(z.enum(["development", "production", "test"])),

  // --------------------------
  // JWT CONFIG
  // --------------------------
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter no mínimo 16 caracteres"),

  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, "JWT_EXPIRES_IN deve seguir o formato: '15m', '1h', '7d' etc."),

  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET deve ter no mínimo 16 caracteres"),

  JWT_REFRESH_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, "JWT_REFRESH_EXPIRES_IN deve seguir o formato: '1d', '12h' etc."),

  // --------------------------
  // COOKIES
  // --------------------------
  COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET deve ter no mínimo 16 caracteres"),

  // --------------------------
  // EMAIL SERVICE
  // --------------------------
  EMAIL_USER: z.string().email("EMAIL_USER deve ser um e-mail válido"),

  EMAIL_PASS: z.string().min(10, "EMAIL_PASS deve ter no mínimo 10 caracteres"),

  // --------------------------
  // DISCORD OAUTH
  // --------------------------
  DISCORD_CLIENT_ID: z.string().min(5, "DISCORD_CLIENT_ID muito curto"),

  DISCORD_CLIENT_SECRET: z.string().min(5, "DISCORD_CLIENT_SECRET muito curto"),

  DISCORD_REDIRECT_URI: z.string().url("DISCORD_REDIRECT_URI deve ser uma URL válida"),

  // --------------------------
  // DISCORD BOT
  // --------------------------
  DISCORD_BOT_TOKEN: z.string().min(30, "DISCORD_BOT_TOKEN parece inválido"),

  DISCORD_TARGET_GUILD_ID: z
    .string()
    .regex(/^\d+$/, "DISCORD_TARGET_GUILD_ID deve ser apenas números"),

  BOT_REQUIRED_PERMISSIONS_INT: z
    .string()
    .regex(/^\d+$/, "BOT_REQUIRED_PERMISSIONS_INT deve ser um número")
    .transform(Number),
});

export const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error("❌ Variáveis de ambiente inválidas:", env.error.format());
  process.exit(1);
}

export const ENV = env.data;
