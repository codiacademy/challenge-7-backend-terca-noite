import { useState } from "react";
import { TimeRangeSelect } from "./TimeRangeSelect";
import { TimeRange } from "../../types/types";

interface HeaderProps {
  title: string;
  children?: React.ReactNode;
  showTimeRange?: boolean;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
}

export const Header = ({
  title,
  children,
  showTimeRange = true,
  onTimeRangeChange,
}: HeaderProps) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("all");

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    setSelectedTimeRange(timeRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(timeRange);
    }
  };

  return (
    <header className="bg-gray-800 text-white p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 max-w-7xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>

        <div className="flex gap-3 flex-col-reverse justify-end">
          {children}

          {showTimeRange && (
            <TimeRangeSelect
              selectedTimeRange={selectedTimeRange}
              onTimeRangeChange={handleTimeRangeChange}
            />
          )}
        </div>
      </div>
    </header>
  );
};
