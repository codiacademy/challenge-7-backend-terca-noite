import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { expensesData } from "../../data/ExpensesData";
import { salesData } from "../../data/SalesData";
import { TimeRange } from "../../types/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Tooltip } from "recharts";
import { getBalanceData } from "@/utils/balanceAggregations";

const chartConfig = {
  receitas: {
    label: "Receitas",
    color: "#10B981",
  },
  despesas: {
    label: "Despesas",
    color: "#c42121",
  },
} satisfies ChartConfig;

interface BalanceBarChartProps {
  timeRange: TimeRange;
}

export const BalanceBarChart = ({ timeRange }: BalanceBarChartProps) => {
  const balanceBarData = getBalanceData(salesData, expensesData, timeRange);

  const hasData =
    balanceBarData.length > 0 &&
    (balanceBarData[0].receitas > 0 || balanceBarData[0].despesas > 0);

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-lg rounded-xl p-6 border border-gray-700 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-[rgba(31, 41, 55, 0.9)] border-none shadow-none h-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-100 mb-4">
            Comparativo de Despesas e Receitas
          </CardTitle>
        </CardHeader>

        {hasData ? (
          <CardContent className="h-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height={300}>
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={balanceBarData}>
                  <CartesianGrid vertical={false} />
                  <YAxis
                    style={{ fontSize: "16px" }}
                    stroke="#9CA3AF"
                    tickFormatter={(value) => value || ""}
                  />
                  <XAxis
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tick={false}
                  />
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div
                            style={{
                              fontSize: "16px",
                              backgroundColor: "rgba(31, 41, 55, 0.9)",
                              borderRadius: "4px",
                              border: "1px solid #4B5563",
                              padding: "8px",
                              color: "#E5E7EB",
                            }}
                          >
                            {payload.map((entry, index) => (
                              <p key={index} style={{ color: "#E5E7EB" }}>
                                {entry.name === "receitas"
                                  ? "Receitas"
                                  : "Despesas"}
                                :{" "}
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(entry.value as number)}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="receitas"
                    fill="var(--color-receitas)"
                    radius={8}
                  />
                  <Bar
                    dataKey="despesas"
                    fill="var(--color-despesas)"
                    radius={8}
                  />
                  <Legend
                    formatter={(name: string) =>
                      name === "receitas" ? "Receitas" : "Despesas"
                    }
                    wrapperStyle={{ fontSize: "16px", color: "#E5E7EB" }}
                  />
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          </CardContent>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhum dado encontrado para o período selecionado.
          </div>
        )}
      </Card>
    </motion.div>
  );
};
