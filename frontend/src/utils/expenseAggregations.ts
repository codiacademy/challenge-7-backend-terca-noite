import {
  parse,
  subWeeks,
  startOfMonth,
  startOfYear,
  isWithinInterval,
  subMonths,
} from "date-fns";
import { Expense, TimeRange } from "../types/types";

// filtro por periodo
export const filterExpensesByTime = (
  expenses: Expense[] | undefined,
  filter: TimeRange
): Expense[] => {
  // verifica se expenses é um array ou undefined
  if (!expenses || !Array.isArray(expenses)) {
    return [];
  }

  const today = new Date();

  if (filter === "all") {
    return expenses;
  }

  let startDate: Date;
  let endDate = today;

  if (typeof filter === "object" && filter.type === "custom") {
    startDate = filter.startDate;
    endDate = filter.endDate;
  } else {
    switch (filter) {
      case "lastWeek":
        startDate = subWeeks(today, 1); // 7 dias atrás
        break;
      case "thisMonth":
        startDate = startOfMonth(today); // Início do mês atual
        break;
      case "lastThreeMonths":
        startDate = subMonths(today, 3); // 3 meses atrás
        break;
      case "thisYear":
        startDate = startOfYear(today); // Início do ano atual
        break;
      default:
        return expenses;
    }
  }

  return expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    return isWithinInterval(expenseDate, { start: startDate, end: endDate });
  });
};

// Função para dados do gráfico de crescimento
export const getExpensesGrowthData = (
  expenses: Expense[],
  timeFilter: TimeRange
) => {
  const filteredExpenses = filterExpensesByTime(expenses, timeFilter);

  // Agrupar por mês
  const monthlyTotals: { [key: string]: number } = {};
  filteredExpenses.forEach((expense) => {
    const date = parse(expense.date, "yyyy-MM-dd", new Date()); // Converte a data para um objeto Date
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`; // Pega o mes e ano
    monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + expense.value; // Soma o valor da despesa
  });

  // Converter para formato do gráfico
  return Object.entries(monthlyTotals)
    .map(([monthYear, totalExpenses]) => {
      const [year, month] = monthYear.split("-");
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
      return {
        month: `${monthNames[parseInt(month) - 1]} ${year}`, // Adiciona o ano ao mês ex: "Jan 2023"
        totalExpenses,
      };
    })
    .sort((a, b) => {
      const [aMonth, aYear] = a.month.split(" ");
      const [bMonth, bYear] = b.month.split(" ");
      const monthIndex = (m: string) =>
        [
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
        ].indexOf(m); // Funcao para pegar o index do mes
      return (
        parseInt(aYear) - parseInt(bYear) ||
        monthIndex(aMonth) - monthIndex(bMonth) // Se os anos forem iguais, compara os meses
      );
    });
};

// Funcao para dados do grafico de tipos de despesas
export const getExpensesTypesData = (
  expenses: Expense[],
  timeFilter: TimeRange
) => {
  const filteredExpenses = filterExpensesByTime(expenses, timeFilter);

  // Somar totais por categoria
  const totals = filteredExpenses.reduce(
    (acc, expense) => {
      if (expense.category.toLowerCase() === "fixa") {
        acc.fixas += expense.value;
      } else if (expense.category.toLowerCase() === "variavel") {
        acc.variaveis += expense.value;
      }
      return acc;
    },
    { fixas: 0, variaveis: 0 }
  );

  // Retornar um array com um único objeto
  return [totals];
};
