import { prisma } from "../lib/prisma.ts";
import { subMonths } from "date-fns";
import { AppError } from "../utils/app-error.ts";
import { createTestUser } from "../functions/users/create-test-user-function.ts";
import { createTestSaleFunction } from "../functions/sales/create-test-sale-function.ts";
import { createTestExpenseFunction } from "../functions/expenses/create-test-expense-function.ts";

async function main() {
  try {
    console.log("🔍 Checking for existing seed data...");

    const salesCount = await prisma.sale.count();
    const expensesCount = await prisma.expense.count();

    const testUser = await createTestUser();

    if (salesCount > 0 && expensesCount > 0) {
      console.log("✔️ Seed já existe. Nada a fazer.");
      return;
    }

    console.log("🚀 Iniciando seeding automático...");

    const salesToCreate = [];
    const expensesToCreate = [];

    for (let i = 0; i < 24; i++) {
      const date = subMonths(new Date(), i);

      // Sale fake
      const sale = await createTestSaleFunction(testUser.id, date);
      const expense = await createTestExpenseFunction(testUser.id, date);

      salesToCreate.push(sale);

      // Expense fake
      expensesToCreate.push(expense);
    }

    if (salesCount === 0) {
      console.log("📌 Inserindo sales...");
      await prisma.sale.createMany({ data: salesToCreate });
    }

    if (expensesCount === 0) {
      console.log("📌 Inserindo expenses...");
      await prisma.expense.createMany({ data: expensesToCreate });
    }

    console.log("✨ Seeding concluído.");
  } catch (error: any) {
    throw new AppError("Erro ao fazer seeding de dados", 400);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
