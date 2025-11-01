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
import { getSalesTypesData } from "@/utils/salesAggregations";
import { salesData } from "@/data/SalesData";
import { TimeRange } from "@/types/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

interface SalesTypesBarProps {
  timeRange: TimeRange;
}

const chartConfig = {
  presencial: {
    label: "Presencial",
    color: "#0e6fff",
  },
  online: {
    label: "Online",
    color: "#37f851",
  },
} satisfies ChartConfig;

export const SalesTypesBar = ({ timeRange }: SalesTypesBarProps) => {
  const salesBarData = getSalesTypesData(salesData, timeRange);

  // Verificar se há dados reais (presencial e online ambos zero significa "sem dados")
  const hasData =
    salesBarData.length > 0 &&
    (salesBarData[0].presencial > 0 || salesBarData[0].online > 0);

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
            Tipos de Vendas
          </CardTitle>
        </CardHeader>

        {hasData ? (
          <CardContent className="h-full flex justify-center items-center">
            <ResponsiveContainer width="100%" height={300}>
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={salesBarData}>
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
                      name === "presencial" ? "Presencial" : "Online",
                    ]}
                  />
                  <Bar
                    dataKey="presencial"
                    fill="var(--color-presencial)"
                    radius={8}
                  />
                  <Bar dataKey="online" fill="var(--color-online)" radius={8} />
                  <Legend
                    formatter={(name: string) =>
                      name === "presencial" ? "Presencial" : "Online"
                    }
                    wrapperStyle={{ fontSize: "16px", color: "#E5E7EB" }}
                  />
                </BarChart>
              </ChartContainer>
            </ResponsiveContainer>
          </CardContent>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma venda encontrada para o período selecionado.
          </div>
        )}
      </Card>
    </motion.div>
  );
};
