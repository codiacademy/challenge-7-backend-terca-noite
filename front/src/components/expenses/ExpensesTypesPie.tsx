import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getExpensesTypesData } from "../../utils/expenseAggregations";
import { expensesData } from "../../data/ExpensesData";
import { TimeRange } from "../../types/types";

interface ExpensesTypesPieProps {
  timeRange: TimeRange;
}

export const ExpensesTypesPie = ({ timeRange }: ExpensesTypesPieProps) => {
  const expensePieData = getExpensesTypesData(expensesData, timeRange);
  const chartData = [
    { name: "fixas", value: expensePieData[0]?.fixas || 0 },
    { name: "variaveis", value: expensePieData[0]?.variaveis || 0 },
  ].filter((item) => item.value > 0);

  const COLORS = ["#0a90a1", "#793fff"];
  const nameMap = {
    fixas: "Despesas Fixas",
    variaveis: "Despesas Variáveis",
  };

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg shadow-lg rounded-xl p-6 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-xl font-semibold text-gray-100 mb-4">
        Tipos de Despesas
      </h2>
      <div style={{ width: "100%", height: 300 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                stroke="none"
                labelLine={true}
                label={({ name, value }) =>
                  `${
                    nameMap[name as keyof typeof nameMap]
                  } - ${new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(value)}`
                }
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
                  nameMap[name as keyof typeof nameMap],
                ]}
              />
              <Legend
                formatter={(value: string) =>
                  nameMap[value as keyof typeof nameMap]
                }
                wrapperStyle={{ color: "#E5E7EB" }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Nenhuma despesa encontrada para o período selecionado.
          </div>
        )}
      </div>
    </motion.div>
  );
};
