import { Header } from "../components/common/Header";
import { motion } from "framer-motion";
import { StatCard } from "../components/common/StatCard";
import { BanknoteArrowDown, BanknoteArrowUp, PiggyBank, TrendingUp } from "lucide-react";

import { SalesCoursePie } from "../components/sales/SalesCoursePie";
import { BalanceLineChart } from "../components/overview/BalanceLineChart";
import { BalanceBarChart } from "../components/overview/BalanceBarChart";
import { SalesGrowth } from "@/components/sales/SalesGrowth";
import { useState } from "react";
import { TimeRange, Sales } from "@/types/types";

import { useEffect } from "react";
import { toast } from "react-toastify";
import { convertTimeRangeToParams } from "../utils/timeRangeTransformations.ts";
import api from "../api/axios-client.ts";

type BalanceStats = {
  totalExpenses: number;
  totalSales: number;
  balance: number;
  avarageSales: number;
};
export function OverviewPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [dateFilteredSales, setDateFilteredSales] = useState<Sales[]>([]);
  const [balanceStats, setBalanceStats] = useState<BalanceStats>({
    totalExpenses: 0,
    totalSales: 0,
    balance: 0,
    avarageSales: 0,
  });
  const [pieChartData, setPieChartData] = useState<any>([]);
  const [barChartData, setBarChartData] = useState<any>([]);
  const [lineChartData, setLineChartData] = useState<any>([]);
  const [growthChartData, setGrowthChartData] = useState<any>([]);

  async function loadOverviewKPIs(params?: {
    timeRange?: TimeRange;
    category?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const token = localStorage.getItem("accessToken") || null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Converte timeRange para from/to
      let from: string | undefined;
      let to: string | undefined;

      const tr = params?.timeRange;

      ({ from, to } = convertTimeRangeToParams(tr));

      const response = await api.get("http://localhost:3000/overview/get_kpis", {
        headers,
        withCredentials: true,
        params: {
          from,
          to,
        },
      });

      if (!response.data) throw new Error(`HTTP ${response.status}`);
      setBalanceStats(response.data.balanceStats);
      console.log("Kpis carregados!");
    } catch (error: any) {
      console.error("Erro ao carregar Kpis:", error);
    }
  }

  async function loadOverviewCharts(params: { timeRange: TimeRange }) {
    try {
      const token = localStorage.getItem("accessToken") || null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let from: string | undefined;
      let to: string | undefined;

      const tr = params?.timeRange;
      ({ from, to } = convertTimeRangeToParams(tr));

      const response = await api.get("http://localhost:3000/overview/get_charts", {
        headers,
        withCredentials: true,
        params: {
          from,
          to,
        },
      });

      if (!response.data) throw new Error(`HTTP ${response.status}`);

      setPieChartData(response.data.pieChartData);
      setBarChartData(response.data.barChartData);
      setGrowthChartData(response.data.growthChartData);
      setLineChartData(response.data.lineChartData);
      setDateFilteredSales(response.data.dateFilteredSales);
      console.log("Gráficos no período carregados!");
    } catch (error: any) {
      console.error("Erro ao carregar gráficos:", error);
    }
  }
  useEffect(() => {
    toast.success("Pagina Overview Carregada!");
    loadOverviewKPIs({ timeRange });
    loadOverviewCharts({ timeRange });
  }, [timeRange]);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <Header title="Dashboard Principal" showTimeRange={true} onTimeRangeChange={setTimeRange} />

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
          <SalesCoursePie dateFilteredSalesData={dateFilteredSales} salesPieData={pieChartData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 sm:gap-8">
          <BalanceBarChart balanceBarData={barChartData} />
          <BalanceLineChart revenueData={lineChartData} />
        </div>

        <div className="flex flex-col gap-6">
          <SalesGrowth growthData={growthChartData} />
        </div>
      </main>
    </div>
  );
}
