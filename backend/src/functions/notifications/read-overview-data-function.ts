import { prisma } from "../../lib/prisma.ts";
import { subMonths } from "date-fns";
import { readDateFilteredExpensesFunction } from "../expenses/read-date-filtered-expenses-function.ts";
import { readDateFilteredSalesFunction } from "../sales/read-date-filtered-sales-function.ts";
type BalanceStats = {
  totalExpenses: number;
  totalSales: number;
  balance: number;
  avarageSales: number;
};

export async function readOverviewData(userId: string): Promise<BalanceStats> {
  // Define o período: Últimos 30 dias
  const to = new Date();
  const from = subMonths(new Date(), 1);

  // Filtro de data
  const dateFilter = {
    from,
    to,
  };

  const salesResult = await readDateFilteredSalesFunction(userId, dateFilter);
  const expensesResult = await readDateFilteredExpensesFunction(userId, dateFilter);
  const filteredSales = salesResult.sales;
  const filteredExpenses = expensesResult.expenses;

  const balanceStats = {
    totalExpenses: filteredExpenses.reduce((sum, expense) => sum + Number(expense.value), 0), // total de despesas
    totalSales: filteredSales.reduce((sum, sale) => sum + Number(sale.total_value), 0), // total de vendas
    balance:
      filteredSales.reduce((sum, sale) => sum + Number(sale.total_value), 0) -
      filteredExpenses.reduce((sum, expense) => sum + Number(expense.value), 0), // saldo
    avarageSales:
      filteredSales.length > 0
        ? filteredSales.reduce((sum, sale) => sum + Number(sale.total_value), 0) /
          filteredSales.length
        : 0, // média de vendas
  };

  return balanceStats;
}
