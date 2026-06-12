import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// BUG (intentional): The chart doesn't re-render when the date range changes.
// The `chartData` is memoized with an empty dependency array, so it computes
// once and never updates. When the user changes the date range filter,
// the summary data changes but the chart keeps showing the old data.
function SalesChart({ data, startDate, endDate }) {
  // BUG: Empty dependency array — chart data never updates after initial render
  const chartData = useMemo(() => {
    if (!data?.chartData) return [];

    return data.chartData.map((point) => ({
      date: point.date,
      revenue: Math.round(point.revenue * 100) / 100,
      orders: point.count,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // BUG: should be [data] or [data?.chartData]

  const formatCurrency = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!chartData.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No chart data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(value, name) => [
                name === "revenue" ? `$${value.toLocaleString()}` : value,
                name === "revenue" ? "Revenue" : "Orders",
              ]}
              labelFormatter={(label) => {
                const date = new Date(label + "T00:00:00");
                return date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default SalesChart;
