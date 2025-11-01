import { Expense, Sales, TimeRange } from "../types/types";
import { filterExpensesByTime } from "./expenseAggregations";
import { filterSalesByTime } from "./salesAggregations";
import { parse } from "date-fns";

interface BalanceData {
  receitas: number;
  despesas: number;
}

export const getBalanceData = (
  sales: Sales[] | undefined,
  expenses: Expense[] | undefined,
  timeRange: TimeRange
): BalanceData[] => {
  if (
    !sales ||
    !Array.isArray(sales) ||
    !expenses ||
    !Array.isArray(expenses)
  ) {
    return [{ receitas: 0, despesas: 0 }];
  }

  const filteredSales = filterSalesByTime(sales, timeRange);
  const filteredExpenses = filterExpensesByTime(expenses, timeRange);

  const totalSales = filteredSales.reduce(
    (acc, sale) => acc + sale.finalPrice,
    0
  );
  const totalExpenses = filteredExpenses.reduce(
    (acc, expense) => acc + expense.value,
    0
  );

  const totals = {
    receitas: totalSales,
    despesas: totalExpenses,
  };

  return [totals];
};

export const getBalanceDataGrowth = (
  sales: Sales[] | undefined,
  expenses: Expense[] | undefined,
  timeRange: TimeRange
) => {
  if (
    !sales ||
    !Array.isArray(sales) ||
    !expenses ||
    !Array.isArray(expenses)
  ) {
    return [];
  }

  const filteredSales = filterSalesByTime(sales, timeRange);
  const filteredExpenses = filterExpensesByTime(expenses, timeRange);

  const monthlySales: { [key: string]: number } = {};
  const monthlyExpenses: { [key: string]: number } = {};

  filteredSales.forEach((sale) => {
    const date = parse(sale.date, "yyyy-MM-dd", new Date());
    const monthYear = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    monthlySales[monthYear] = (monthlySales[monthYear] || 0) + sale.finalPrice;
  });

  filteredExpenses.forEach((expense) => {
    const date = parse(expense.date, "yyyy-MM-dd", new Date());
    const monthYear = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    monthlyExpenses[monthYear] =
      (monthlyExpenses[monthYear] || 0) + expense.value;
  });
  
  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const totals = Object.entries(monthlySales).map(([monthYear, totalSales]) => {
    const [year, month] = monthYear.split("-");

    const monthName = monthNames[parseInt(month) - 1];
    const totalExpenses = monthlyExpenses[monthYear] || 0;

    return {
      month: `${monthName} ${year}`, // Combinar mês e ano em uma única chave
      receitas: totalSales,
      despesas: totalExpenses,
    };
  });

  return totals.sort((a, b) => {
    const [aMonth, aYear] = a.month.split(" ");
    const [bMonth, bYear] = b.month.split(" ");
    const monthIndex = (m: string) => monthNames.indexOf(m);
    return (
      parseInt(aYear) - parseInt(bYear) ||
      monthIndex(aMonth) - monthIndex(bMonth)
    );
  });
};
