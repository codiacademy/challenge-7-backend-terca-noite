import {
  parse,
  subWeeks,
  startOfMonth,
  startOfYear,
  isWithinInterval,
  subMonths,
} from "date-fns";
import { Sales, TimeRange } from "../types/types";

// Filtro por período
export const filterSalesByTime = (
  sales: Sales[] | undefined,
  filter: TimeRange
): Sales[] => {
  if (!sales || !Array.isArray(sales)) {
    return [];
  }

  const today = new Date();

  if (filter === "all") {
    return sales;
  }

  let startDate: Date;
  let endDate = today;

  if (typeof filter === "object" && filter.type === "custom") {
    startDate = filter.startDate;
    endDate = filter.endDate;
  } else {
    switch (filter) {
      case "lastWeek":
        startDate = subWeeks(today, 1);
        break;
      case "thisMonth":
        startDate = startOfMonth(today);
        break;
      case "lastThreeMonths":
        startDate = subMonths(today, 3);
        break;
      case "thisYear":
        startDate = startOfYear(today);
        break;
      default:
        return sales;
    }
  }

  return sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    return isWithinInterval(saleDate, { start: startDate, end: endDate });
  });
};

// Função para o gráfico de crescimento
export const getSalesGrowthData = (sales: Sales[], timeFilter: TimeRange) => {
  const filteredSales = filterSalesByTime(sales, timeFilter);

  const monthlyTotals: { [key: string]: number } = {};
  filteredSales.forEach((sale) => {
    const date = parse(sale.date, "yyyy-MM-dd", new Date());
    const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
    monthlyTotals[monthYear] =
      (monthlyTotals[monthYear] || 0) + sale.finalPrice;
  });

  return Object.entries(monthlyTotals)
    .map(([monthYear, totalSales]) => {
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
        month: `${monthNames[parseInt(month) - 1]} ${year}`,
        totalSales,
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
        ].indexOf(m);

      return (
        parseInt(aYear) - parseInt(bYear) ||
        monthIndex(aMonth) - monthIndex(bMonth)
      );
    });
};

// Função para pegar os dados do gráfico de tipos de vendas (por tipo de curso)
export const getSalesTypesData = (sales: Sales[], timeFilter: TimeRange) => {
  const filteredSales = filterSalesByTime(sales, timeFilter);

  const totals = filteredSales.reduce(
    (acc, sale) => {
      if (sale.course.type === "presencial") {
        acc.presencial += sale.finalPrice;
      } else {
        acc.online += sale.finalPrice;
      }
      return acc;
    },
    { presencial: 0, online: 0 }
  );

  return [{ presencial: totals.presencial, online: totals.online }];
};

// Nova função para pegar os dados por nome do curso
export const getSalesCoursesData = (sales: Sales[], timeFilter: TimeRange) => {
  const filteredSales = filterSalesByTime(sales, timeFilter);

  const totalsByCourse: { [key: string]: number } = {};
  filteredSales.forEach((sale) => {
    const courseName = sale.course.name;
    totalsByCourse[courseName] =
      (totalsByCourse[courseName] || 0) + sale.finalPrice;
  });

  return Object.entries(totalsByCourse).map(([name, value]) => ({
    name,
    value,
  }));
};
