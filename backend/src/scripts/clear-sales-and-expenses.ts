import { prisma } from "../lib/prisma.ts";

async function clearSalesAndExpenses() {
  // Deleta todas as sales
  const deletedSales = await prisma.sale.deleteMany({});
  // Deleta todas as expenses
  const deletedExpenses = await prisma.expense.deleteMany({});

  console.log(`${deletedSales.count} vendas (sales) deletadas.`);
  console.log(`${deletedExpenses.count} despesas (expenses) deletadas.`);
}

clearSalesAndExpenses()
  .catch((e) => {
    console.error("Erro ao deletar sales e expenses:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
