-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('fixa', 'variavel');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pago', 'pendente');

-- CreateEnum
CREATE TYPE "CourseType" AS ENUM ('presencial', 'online');

-- CreateTable
CREATE TABLE "users" (
    "id" CHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telephone" TEXT,
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "notification_email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "notification_discord_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "discordId" VARCHAR(255),
    "discordName" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" CHAR(36) NOT NULL,
    "client_name" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(14) NOT NULL,
    "client_phone" VARCHAR(20) NOT NULL,
    "client_email" VARCHAR(255) NOT NULL,
    "course" VARCHAR(255) NOT NULL,
    "course_type" "CourseType" NOT NULL,
    "course_value" DECIMAL(10,2) NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "taxes_value" DECIMAL(10,2) NOT NULL,
    "commission_value" DECIMAL(10,2) NOT NULL,
    "card_fee_value" DECIMAL(10,2) NOT NULL,
    "total_value" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" CHAR(36) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" CHAR(36) NOT NULL,
    "due_date" DATE NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "status" "ExpenseStatus" NOT NULL,
    "created_by" CHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refreshtokens" (
    "id" CHAR(36) NOT NULL,
    "tokenHash" VARCHAR(255) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "expiresAt" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refreshtokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthState" (
    "state" CHAR(36) NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthState_pkey" PRIMARY KEY ("state")
);

-- CreateTable
CREATE TABLE "two_factor_requests" (
    "id" TEXT NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,

    CONSTRAINT "two_factor_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_discordId_key" ON "users"("discordId");

-- CreateIndex
CREATE INDEX "idx_sales_created_by" ON "sales"("created_by");

-- CreateIndex
CREATE INDEX "idx_expenses_created_by" ON "expenses"("created_by");

-- CreateIndex
CREATE INDEX "idx_refresh_token_user" ON "refreshtokens"("userId");

-- CreateIndex
CREATE INDEX "idx_two_factor_user" ON "two_factor_requests"("userId");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refreshtokens" ADD CONSTRAINT "fk_refresh_token_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthState" ADD CONSTRAINT "AuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_requests" ADD CONSTRAINT "TwoFactorRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
