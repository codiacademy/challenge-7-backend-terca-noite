import { motion } from "framer-motion";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import { salesData } from "../../data/SalesData";
import { getSalesGrowthData } from "@/utils/salesAggregations";
import { TimeRange } from "@/types/types";

interface SalesGrowthProps {
  timeRange: TimeRange;
}

export const SalesGrowth = ({ timeRange }: SalesGrowthProps) => {
  const growthData = getSalesGrowthData(salesData, timeRange);

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-xl font-semibold text-gray-100 mb-4">
        Crescimento de Vendas
      </h2>
      <div className="h-[320px] sm:h-[400px] overflow-x-auto">
        {growthData.length > 0 ? (
          <div className="h-full min-w-[600px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={growthData}
                margin={{ top: 5, right: 20, left: 0, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                  
                />
                <YAxis
                  stroke="#9CA3AF"
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      minimumFractionDigits: 0,
                    }).format(value)
                  }
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.8)",
                    borderColor: "#4B5563",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                  itemStyle={{ color: "#E5E7EB" }}
                  formatter={(value: number, name: string) => [
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value),
                    name === "totalSales" ? "Vendas totais" : name,
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="totalSales"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma venda encontrada para o período selecionado.
          </div>
        )}
      </div>
    </motion.div>
  );
};
