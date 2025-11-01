import { Calendar } from "lucide-react";
import { TimeRange } from "../../types/types";
import { useState } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { ptBR } from "date-fns/locale";

interface TimeRangeSelectProps {
  selectedTimeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
}

export const TimeRangeSelect = ({
  selectedTimeRange,
  onTimeRangeChange,
}: TimeRangeSelectProps) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });

  const handleSelect = (ranges: any) => {
    setDateRange(ranges.selection);
  };

  const applyCustomRange = () => {
    onTimeRangeChange({
      type: "custom",
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });
    setShowDatePicker(false);
  };

  return (
    <div className="relative w-full sm:w-auto">
      <Calendar className="absolute left-3 top-4 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
      <select
        className="w-full sm:w-48 bg-gray-700 text-white rounded-md pl-10 pr-3 py-1.5 sm:py-1 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        value={
          typeof selectedTimeRange === "object" ? "custom" : selectedTimeRange // se for um objeto, significa que nao é um time range definido (lastWeek, thisMonth, etc)
        }
        onChange={(e) => {
          if (e.target.value === "custom") {
            setShowDatePicker(true);
          } else {
            onTimeRangeChange(e.target.value as TimeRange);
          }
        }}
        aria-label="Selecionar intervalo de tempo"
      >
        <option value="lastWeek">Última Semana</option>
        <option value="thisMonth">Este Mês</option>
        <option value="lastThreeMonths">Últimos 3 Meses</option>
        <option value="thisYear">Este Ano</option>
        <option value="custom">Período Personalizado</option>
        <option value="all">Todo o período</option>
      </select>

      {showDatePicker && (
        <div className="absolute z-50 mt-2 bg-gray-800 p-4 rounded-lg shadow-lg">
          <DateRange
            editableDateInputs={true}
            onChange={handleSelect}
            moveRangeOnFirstSelection={false}
            ranges={[dateRange]}
            className="date-range"
            dateDisplayFormat="dd/MM/yyyy"
            
            locale={ptBR}
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => setShowDatePicker(false)}
              className="px-3 py-1 text-sm text-gray-300 hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={applyCustomRange}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
