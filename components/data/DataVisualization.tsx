"use client";

import { useState, useMemo, useRef } from "react";
import {
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Activity,
  Calendar,
  Download,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  Bar,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import Button from "../ui/Button";
import ChartExportModal from "../ui/ChartExportModal";
import {
  exportChart,
  ExportOptions,
  ChartExportData,
} from "../../lib/utils/chartExport";

interface DataVisualizationProps {
  data: any[];
  columns: string[];
  className?: string;
}

type ChartType = "bar" | "line" | "pie" | "area" | "time-series";

export default function DataVisualization({
  data,
  columns,
  className = "",
}: DataVisualizationProps) {
  const [chartType, setChartType] = useState<ChartType>("time-series");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    columns[0] || "",
  ]);
  const [timeColumn, setTimeColumn] = useState<string>("");
  const [showExportModal, setShowExportModal] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // Get numeric columns for charting
  const numericColumns = useMemo(() => {
    return columns.filter((col) => {
      return data.some((row) => {
        const value = row[col];
        return !isNaN(Number(value)) && value !== null && value !== "";
      });
    });
  }, [columns, data]);

  // Get date/time columns
  const dateColumns = useMemo(() => {
    return columns.filter((col) => {
      return data.some((row) => {
        const value = row[col];
        if (!value) return false;
        const date = new Date(value);
        return !isNaN(date.getTime());
      });
    });
  }, [columns, data]);

  // Auto-detect time column if not set
  useMemo(() => {
    if (!timeColumn && dateColumns.length > 0) {
      setTimeColumn(dateColumns[0]);
    }
  }, [dateColumns, timeColumn]);

  // Generate chart data based on type
  const chartData = useMemo(() => {
    if (
      chartType === "time-series" &&
      timeColumn &&
      selectedColumns.length > 0
    ) {
      return generateTimeSeriesData(data, timeColumn, selectedColumns);
    } else if (chartType === "pie") {
      return generatePieChartData(data, selectedColumns[0]);
    } else {
      return generateBarChartData(data, selectedColumns[0]);
    }
  }, [data, chartType, timeColumn, selectedColumns]);

  // Chart colors
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#8b5cf6", // purple
    "#f59e0b", // orange
    "#ef4444", // red
    "#ec4899", // pink
    "#6366f1", // indigo
    "#84cc16", // lime
  ];

  function generateTimeSeriesData(
    data: any[],
    timeCol: string,
    valueCols: string[]
  ) {
    if (!timeCol || valueCols.length === 0) return [];

    return data
      .filter((row) => row[timeCol])
      .map((row) => {
        const result: any = {
          time: new Date(row[timeCol]).toLocaleDateString(),
          timestamp: new Date(row[timeCol]).getTime(),
        };

        valueCols.forEach((col) => {
          const value = parseFloat(row[col]);
          result[col] = isNaN(value) ? 0 : value;
        });

        return result;
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  function generatePieChartData(data: any[], column: string) {
    if (!column) return [];

    const counts: { [key: string]: number } = {};
    data.forEach((row) => {
      const value = row[column] || "Unknown";
      counts[value] = (counts[value] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 values
  }

  function generateBarChartData(data: any[], column: string) {
    if (!column) return [];

    const groups: { [key: string]: number } = {};
    data.forEach((row) => {
      const value = row[column] || "Unknown";
      groups[value] = (groups[value] || 0) + 1;
    });

    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 values
  }

  // Export functionality
  const handleExport = async (options: ExportOptions) => {
    if (!chartRef.current) {
      throw new Error("Chart element not found");
    }

    const chartExportData: ChartExportData = {
      element: chartRef.current,
      title: `Data Visualization - ${chartType
        .replace("-", " ")
        .toUpperCase()}`,
      description: `Chart showing ${selectedColumns.join(", ")} data with ${
        data.length
      } data points`,
      metadata: {
        chartType: chartType,
        dataPoints: data.length,
        columns: selectedColumns,
        generatedAt: new Date(),
      },
    };

    await exportChart(chartExportData, options);
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-white text-opacity-40 mx-auto mb-4" />
            <p className="text-white text-opacity-60">
              No data available for visualization
            </p>
          </div>
        </div>
      );
    }

    const customTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
            <p className="text-white font-medium">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p
                key={index}
                className="text-white"
                style={{ color: entry.color }}
              >
                {`${entry.dataKey}: ${entry.value}`}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    if (chartType === "time-series") {
      return (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={customTooltip} />
              <Legend />
              {selectedColumns.map((col, index) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{
                    fill: colors[index % colors.length],
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{
                    r: 6,
                    stroke: colors[index % colors.length],
                    strokeWidth: 2,
                  }}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chartType === "area") {
      return (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip content={customTooltip} />
              <Legend />
              {selectedColumns.map((col, index) => (
                <Area
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (chartType === "pie") {
      return (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={customTooltip} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Bar chart
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip content={customTooltip} />
            <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className={`card rounded-2xl ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white border-opacity-10">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            Data Visualization
          </h3>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setShowExportModal(true)}
              variant="outline"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              disabled={chartData.length === 0}
            >
              Export
            </Button>
            {chartType === "time-series" && dateColumns.length > 0 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-white text-opacity-70">
                  Time:
                </label>
                <select
                  value={timeColumn}
                  onChange={(e) => setTimeColumn(e.target.value)}
                  className="input text-sm py-1 px-2 min-w-32"
                >
                  {dateColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-white text-opacity-70">
                {chartType === "time-series" ? "Values:" : "Column:"}
              </label>
              <select
                value={selectedColumns[0] || ""}
                onChange={(e) => setSelectedColumns([e.target.value])}
                className="input text-sm py-1 px-2 min-w-32"
              >
                {numericColumns.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="px-6 py-4 border-b border-white border-opacity-10">
        <div className="flex space-x-2">
          {[
            { type: "time-series", label: "Time Series", icon: Activity },
            { type: "area", label: "Area Chart", icon: TrendingUp },
            { type: "bar", label: "Bar Chart", icon: BarChart3 },
            { type: "line", label: "Line Chart", icon: LineChart },
            { type: "pie", label: "Pie Chart", icon: PieChart },
          ].map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              onClick={() => setChartType(type as ChartType)}
              variant={chartType === type ? "primary" : "ghost"}
              size="sm"
              icon={<Icon className="h-4 w-4" />}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-6" ref={chartRef}>
        {renderChart()}
      </div>

      {/* Export Modal */}
      <ChartExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        chartData={{
          element: chartRef.current!,
          title: `Data Visualization - ${chartType
            .replace("-", " ")
            .toUpperCase()}`,
          description: `Chart showing ${selectedColumns.join(", ")} data with ${
            data.length
          } data points`,
          metadata: {
            chartType: chartType,
            dataPoints: data.length,
            columns: selectedColumns,
            generatedAt: new Date(),
          },
        }}
        defaultFormat="png"
      />
    </div>
  );
}
