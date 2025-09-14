"use client";

import { useState } from "react";
import { Table, BarChart3, Eye, Download, BarChart } from "lucide-react";
import DataTable from "./DataTable";
import DataSummaryCards from "./DataSummaryCards";
import DataVisualization from "./DataVisualization";
import ColumnStatistics from "./ColumnStatistics";
import Button from "../ui/Button";

interface DataViewProps {
  data: any[];
  columns: string[];
  title?: string;
  className?: string;
}

type ViewMode = "table" | "charts" | "statistics";

export default function DataView({
  data,
  columns,
  title,
  className = "",
}: DataViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [showAll, setShowAll] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className={`card rounded-2xl p-8 text-center ${className}`}>
        <BarChart3 className="h-12 w-12 text-white text-opacity-40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          No Data Available
        </h3>
        <p className="text-white text-opacity-60">
          Import some data to see visualizations and insights.
        </p>
      </div>
    );
  }

  const numericColumns = columns.filter((col) => {
    return data.some((row) => {
      const value = row[col];
      return !isNaN(Number(value)) && value !== null && value !== "";
    });
  });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {title || "Data Analysis"}
          </h2>
          <p className="text-white text-opacity-60 mt-1">
            {data.length.toLocaleString()} records • {columns.length} columns
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowAll(!showAll)}
            variant="ghost"
            size="sm"
            icon={<Eye className="h-4 w-4" />}
          >
            {showAll ? "Hide Details" : "Show All"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <DataSummaryCards data={data} columns={columns} />

      {/* View Mode Selector */}
      <div className="flex space-x-2">
        <Button
          onClick={() => setViewMode("table")}
          variant={viewMode === "table" ? "primary" : "ghost"}
          size="sm"
          icon={<Table className="h-4 w-4" />}
        >
          Table View
        </Button>
        <Button
          onClick={() => setViewMode("charts")}
          variant={viewMode === "charts" ? "primary" : "ghost"}
          size="sm"
          icon={<BarChart3 className="h-4 w-4" />}
        >
          Charts
        </Button>
        <Button
          onClick={() => setViewMode("statistics")}
          variant={viewMode === "statistics" ? "primary" : "ghost"}
          size="sm"
          icon={<BarChart className="h-4 w-4" />}
        >
          Statistics
        </Button>
      </div>

      {/* Content */}
      {viewMode === "table" && (
        <DataTable
          data={data}
          columns={columns.map((col) => ({
            key: col,
            label: col,
            sortable: true,
          }))}
          title="Data Table"
          searchable={true}
          downloadable={true}
        />
      )}

      {viewMode === "charts" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataVisualization
            data={data}
            columns={columns}
            className="lg:col-span-2"
          />
        </div>
      )}

      {viewMode === "statistics" && (
        <ColumnStatistics data={data} columns={columns} showDetails={showAll} />
      )}

      {/* Quick Stats */}
      {showAll && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h4 className="text-sm font-medium text-white text-opacity-70 mb-2">
              Data Types
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white text-opacity-60">Numeric</span>
                <span className="text-white">{numericColumns.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white text-opacity-60">Text</span>
                <span className="text-white">
                  {columns.length - numericColumns.length}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h4 className="text-sm font-medium text-white text-opacity-70 mb-2">
              Memory Usage
            </h4>
            <div className="text-sm text-white">
              ~{(JSON.stringify(data).length / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>

          <div className="card p-4">
            <h4 className="text-sm font-medium text-white text-opacity-70 mb-2">
              Unique Values
            </h4>
            <div className="text-sm text-white">
              {new Set(
                data.flatMap((row) => Object.values(row))
              ).size.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
