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
import { getExpensesTypesData } from "../../utils/expenseAggregations";
import { expensesData } from "../../data/ExpensesData";
import { TimeRange } from "../../types/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

const chartConfig = {
  fixas: {
    label: "Despesas Fixas",
    color: "#0a90a1",
  },
  variaveis: {
    label: "Despesas Variáveis",
    color: "#793fff",
  },
} satisfies ChartConfig;

interface ExpensesTypesBarProps {
  timeRange: TimeRange;
}

export function ExpensesTypesBar({ timeRange }: ExpensesTypesBarProps) {
  const expenseBarData = getExpensesTypesData(expensesData, timeRange);

  const hasData =
    expenseBarData.length > 0 &&
    (expenseBarData[0].fixas > 0 || expenseBarData[0].variaveis > 0);

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 min-h-[400px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-[rgba(31, 41, 55, 0.9)] border-none shadow-none h-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-100 mb-4">
            Tipos de Despesas
          </CardTitle>
        </CardHeader>

        {hasData ? (
          <CardContent className="h-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height={300}>
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={expenseBarData}>
                  <CartesianGrid vertical={false} />
                  <YAxis style={{ fontSize: "16px" }} stroke="#9CA3AF" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value || ""}
                  />
                  <ChartTooltip
                    cursor={false}
                    contentStyle={{
                      fontSize: "16px",
                      backgroundColor: "rgba(31, 41, 55, 0.9)",
                      borderRadius: "4px",
                      border: "1px solid #4B5563",
                      padding: "8px",
                      color: "#E5E7EB",
                    }}
                    itemStyle={{ color: "#E5E7EB" }}
                    formatter={(value: number, name: string) => [
                      new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(value),
                      name === "fixas"
                        ? "Despesas Fixas"
                        : "Despesas Variáveis",
                    ]}
                  />
                  <Bar dataKey="fixas" fill="var(--color-fixas)" radius={8} />
                  <Bar
                    dataKey="variaveis"
                    fill="var(--color-variaveis)"
                    radius={8}
                  />
                  <Legend
                    formatter={(name: string) =>
                      name === "fixas" ? "Despesas Fixas" : "Despesas Variáveis"
                    }
                    wrapperStyle={{ fontSize: "16px", color: "#E5E7EB" }}
                  />
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          </CardContent>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma despesa encontrada para o período selecionado.
          </div>
        )}
      </Card>
    </motion.div>
  );
}
