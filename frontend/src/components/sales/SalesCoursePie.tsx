import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getSalesCoursesData } from "@/utils/salesAggregations";
import { salesData } from "@/data/SalesData";
import { Sales, TimeRange } from "@/types/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#6b7280",
  "#9333ea",
  "#22c55e",
  "#eab308",
  "#3b82f6",
  "#84cc16",
  "#a855f7",
];

interface SalesCoursePieProps {
  timeRange: TimeRange;
}

export const SalesCoursePie = ({ timeRange }: SalesCoursePieProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const salesPieData = getSalesCoursesData(salesData, timeRange);

  const sortedData = [...salesPieData].sort((a, b) => b.value - a.value);
  const topFive = sortedData.slice(0, 5);
  const othersTotal = sortedData
    .slice(5)
    .reduce((sum, item) => sum + item.value, 0);

  const chartData =
    othersTotal > 0
      ? [...topFive, { name: "Outros", value: othersTotal }]
      : topFive;

  // Calcular o valor total para percentuais
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  // Função para obter o tipo do curso a partir do nome (usando salesData)
  const getCourseType = (courseName: string) => {
    const sale = salesData.find(
      (sale: Sales) => sale.course.name === courseName
    );
    return sale ? sale.course.type : "N/A";
  };

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-lg font-medium mb-4 text-gray-100">
        Cursos mais vendidos
      </h2>

      <div className="flex flex-col gap-4">
        {/* Gráfico */}
        <div className="h-80">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(31, 41, 55, 0.9)",
                    borderRadius: "4px",
                    border: "1px solid #4b5563",
                    padding: "8px",
                    color: "#e5e7eb",
                  }}
                  itemStyle={{ color: "#e5e7eb" }}
                  formatter={(value: number) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Nenhum curso vendido no período selecionado.
            </div>
          )}
        </div>

        {/* Legenda personalizada */}
        {chartData.length > 0 && (
          <div className="flex mb-5 flex-row flex-wrap gap-2 md:gap-3 justify-center max-h-24 overflow-y-auto">
            {chartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className={`text-xs sm:text-lg`} style={{ color: COLORS[index % COLORS.length] }}>{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de detalhes */}
      <div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex cursor-pointer items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm mb-2"
        >
          {showDetails ? (
            <>
              <ChevronUp size={16} /> Ocultar detalhes
            </>
          ) : (
            <>
              <ChevronDown size={16} /> Ver detalhes
            </>
          )}
        </button>

        {showDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="overflow-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-rounded"
          >
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Percentual
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                      {item.name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                      {getCourseType(item.name)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.value)}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                      {((item.value / totalValue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
