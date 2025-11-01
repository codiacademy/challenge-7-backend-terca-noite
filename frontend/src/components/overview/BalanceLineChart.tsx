import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TimeRange } from "@/types/types";
import { salesData } from "@/data/SalesData";
import { expensesData } from "@/data/ExpensesData";
import { getBalanceDataGrowth } from "@/utils/balanceAggregations";
interface BalanceLineChartProps {
  timeRange: TimeRange;
}

export const BalanceLineChart = ({ timeRange }: BalanceLineChartProps) => {
  const revenueData = getBalanceDataGrowth(salesData, expensesData, timeRange);

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-lg rounded-xl p-6 border border-gray-700 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-100">
          Receitas vs Despesas
        </h2>
      </div>

      <div className="h-[320px] sm:h-[400px] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-rounded">
        {revenueData.length > 0 ? (
          <div className="h-full min-w-[600px] w-full">
            <ResponsiveContainer>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    borderColor: "#4B5563",
                  }}
                  itemStyle={{ color: "#E5E7EB" }}
                  formatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value as number)
                  }
                />

                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.7}
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="#c42121"
                  fill="#c42121"
                  fillOpacity={0.8}
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma informação encontrada para o período selecionado.
          </div>
        )}
      </div>
    </motion.div>
  );
};
