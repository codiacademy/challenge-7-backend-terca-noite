import { Header } from "../components/common/Header";
import { motion } from "framer-motion";
import { StatCard } from "../components/common/StatCard";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  PiggyBank,
  TrendingUp,
} from "lucide-react";

import { SalesCoursePie } from "../components/sales/SalesCoursePie";
import { BalanceLineChart } from "../components/overview/BalanceLineChart";
import { BalanceBarChart } from "../components/overview/BalanceBarChart";
import { SalesGrowth } from "@/components/sales/SalesGrowth";
import { useState } from "react";
import { TimeRange } from "@/types/types";

import { salesData } from "@/data/SalesData";
import { expensesData } from "@/data/ExpensesData";

import { filterSalesByTime } from "@/utils/salesAggregations";
import { filterExpensesByTime } from "@/utils/expenseAggregations";

export function OverviewPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const filteredExpenses = filterExpensesByTime(expensesData, timeRange);
  const filteredSales = filterSalesByTime(salesData, timeRange);

  const balanceStats = {
    totalExpenses: filteredExpenses.reduce(
      (sum, expense) => sum + expense.value,
      0
    ), // total de despesas
    totalSales: filteredSales.reduce((sum, sale) => sum + sale.finalPrice, 0), // total de vendas
    balance:
      filteredSales.reduce((sum, sale) => sum + sale.finalPrice, 0) -
      filteredExpenses.reduce((sum, expense) => sum + expense.value, 0), // saldo
    avarageSales:
      filteredSales.length > 0
        ? filteredSales.reduce((sum, sale) => sum + sale.finalPrice, 0) /
          filteredSales.length
        : 0, // média de vendas
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header
        title="Dashboard Principal"
        showTimeRange={true}
        onTimeRangeChange={setTimeRange}
      />

      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total de vendas"
            icon={BanknoteArrowUp}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(balanceStats.totalSales)}
            color="#10b981"
          />
          <StatCard
            name="Total de despesas"
            icon={BanknoteArrowDown}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(balanceStats.totalExpenses)}
            color="#eb1a1a"
          />
          <StatCard
            name="Balanço"
            icon={PiggyBank}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(balanceStats.balance)}
            color="#205bff"
          />
          <StatCard
            name="Média de vendas"
            icon={TrendingUp}
            value={new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(balanceStats.avarageSales)}
            color="#ec4899"
          />
        </motion.div>

        {/* CHARTS */}
        <div className="mb-8">
          <SalesCoursePie timeRange={timeRange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 sm:gap-8">
          <BalanceBarChart timeRange={timeRange} />
          <BalanceLineChart timeRange={timeRange} />
        </div>

        <div className="flex flex-col gap-6">
          <SalesGrowth timeRange={timeRange} />
        </div>
      </main>
    </div>
  );
}
