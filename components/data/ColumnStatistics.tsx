"use client";

import { useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Hash,
  Calendar,
  ToggleLeft,
  Type,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import Button from "../ui/Button";

export interface ColumnStatistics {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "unknown";
  nullable: boolean;
  unique: boolean;
  totalCount: number;
  nullCount: number;
  uniqueCount: number;
  sampleValues: any[];
  statistics?: {
    min?: number;
    max?: number;
    avg?: number;
    median?: number;
    stdDev?: number;
    quartiles?: {
      q1: number;
      q2: number;
      q3: number;
    };
  };
  quality: {
    score: number; // 0-100
    issues: string[];
    recommendations: string[];
  };
}

interface ColumnStatisticsProps {
  data: any[];
  columns: string[];
  className?: string;
  showDetails?: boolean;
}

export default function ColumnStatistics({
  data,
  columns,
  className = "",
  showDetails = true,
}: ColumnStatisticsProps) {
  const columnStats = useMemo(() => {
    return columns.map((column) => calculateColumnStatistics(column, data));
  }, [columns, data]);

  const overallQuality = useMemo(() => {
    const avgQuality =
      columnStats.reduce((sum, stat) => sum + stat.quality.score, 0) /
      columnStats.length;
    const totalIssues = columnStats.reduce(
      (sum, stat) => sum + stat.quality.issues.length,
      0
    );

    return {
      score: Math.round(avgQuality),
      totalIssues,
      totalColumns: columnStats.length,
    };
  }, [columnStats]);

  const getTypeIcon = (type: ColumnStatistics["type"]) => {
    switch (type) {
      case "number":
        return <Hash className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "boolean":
        return <ToggleLeft className="h-4 w-4" />;
      case "string":
        return <Type className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  const getQualityIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />;
    if (score >= 70) return <Info className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  if (!data || data.length === 0) {
    return (
      <div className={`card rounded-2xl p-8 text-center ${className}`}>
        <BarChart3 className="h-12 w-12 text-white text-opacity-40 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          No Data for Analysis
        </h3>
        <p className="text-white text-opacity-60">
          Import data to see column statistics and quality metrics.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Quality Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">
              Data Quality Overview
            </h3>
          </div>
          <div
            className={`flex items-center space-x-2 ${getQualityColor(
              overallQuality.score
            )}`}
          >
            {getQualityIcon(overallQuality.score)}
            <span className="text-2xl font-bold">{overallQuality.score}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {overallQuality.totalColumns}
            </div>
            <div className="text-sm text-white text-opacity-60">Columns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {data.length.toLocaleString()}
            </div>
            <div className="text-sm text-white text-opacity-60">Rows</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {overallQuality.totalIssues}
            </div>
            <div className="text-sm text-white text-opacity-60">
              Issues Found
            </div>
          </div>
        </div>

        {overallQuality.totalIssues > 0 && (
          <div className="mt-4 p-3 bg-yellow-500 bg-opacity-10 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                Data Quality Issues Detected
              </span>
            </div>
            <p className="text-xs text-white text-opacity-70 mt-1">
              Review individual column statistics below for detailed
              recommendations.
            </p>
          </div>
        )}
      </div>

      {/* Column Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {columnStats.map((stat, index) => (
          <div key={stat.name} className="card p-6">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getTypeIcon(stat.type)}
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    {stat.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-white text-opacity-60 capitalize">
                      {stat.type}
                    </span>
                    {stat.nullable && (
                      <span className="px-2 py-1 bg-orange-500 bg-opacity-20 text-orange-400 rounded-full text-xs">
                        Nullable
                      </span>
                    )}
                    {stat.unique && (
                      <span className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded-full text-xs">
                        Unique
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div
                className={`flex items-center space-x-2 ${getQualityColor(
                  stat.quality.score
                )}`}
              >
                {getQualityIcon(stat.quality.score)}
                <span className="text-lg font-bold">{stat.quality.score}%</span>
              </div>
            </div>

            {/* Basic Statistics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-white bg-opacity-5 rounded-lg">
                <div className="text-xl font-bold text-white">
                  {stat.totalCount.toLocaleString()}
                </div>
                <div className="text-xs text-white text-opacity-60">
                  Total Values
                </div>
              </div>
              <div className="text-center p-3 bg-white bg-opacity-5 rounded-lg">
                <div className="text-xl font-bold text-white">
                  {stat.nullCount}
                </div>
                <div className="text-xs text-white text-opacity-60">
                  Null Values
                </div>
              </div>
            </div>

            {/* Numeric Statistics */}
            {stat.statistics && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-white text-opacity-70 mb-3">
                  Statistical Summary
                </h5>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white text-opacity-60">Min:</span>
                    <span className="text-white font-medium">
                      {stat.statistics.min}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white text-opacity-60">Max:</span>
                    <span className="text-white font-medium">
                      {stat.statistics.max}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white text-opacity-60">Average:</span>
                    <span className="text-white font-medium">
                      {stat.statistics.avg?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white text-opacity-60">Median:</span>
                    <span className="text-white font-medium">
                      {stat.statistics.median?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sample Values */}
            {showDetails && stat.sampleValues.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-white text-opacity-70 mb-2">
                  Sample Values
                </h5>
                <div className="flex flex-wrap gap-1">
                  {stat.sampleValues.slice(0, 5).map((value, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white bg-opacity-10 rounded text-xs text-white text-opacity-80"
                    >
                      {String(value).length > 20
                        ? `${String(value).substring(0, 20)}...`
                        : String(value)}
                    </span>
                  ))}
                  {stat.sampleValues.length > 5 && (
                    <span className="px-2 py-1 bg-white bg-opacity-5 rounded text-xs text-white text-opacity-60">
                      +{stat.sampleValues.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Quality Issues */}
            {stat.quality.issues.length > 0 && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-white text-opacity-70 mb-2">
                  Issues
                </h5>
                <ul className="space-y-1">
                  {stat.quality.issues.map((issue, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-yellow-400 flex items-start space-x-2"
                    >
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {stat.quality.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-white text-opacity-70 mb-2">
                  Recommendations
                </h5>
                <ul className="space-y-1">
                  {stat.quality.recommendations.map((rec, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-green-400 flex items-start space-x-2"
                    >
                      <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to calculate column statistics
function calculateColumnStatistics(
  columnName: string,
  data: any[]
): ColumnStatistics {
  const values = data
    .map((row) => row[columnName])
    .filter((val) => val !== undefined);
  const nonNullValues = values.filter((val) => val !== null && val !== "");
  const uniqueValues = [...new Set(nonNullValues)];

  // Detect column type
  const type = detectColumnType(nonNullValues);

  // Calculate statistics for numeric columns
  const statistics =
    type === "number" ? calculateNumericStatistics(nonNullValues) : undefined;

  // Calculate data quality
  const quality = calculateDataQuality(
    columnName,
    values,
    nonNullValues,
    uniqueValues,
    type
  );

  return {
    name: columnName,
    type,
    nullable: values.length < data.length,
    unique: uniqueValues.length === nonNullValues.length,
    totalCount: values.length,
    nullCount: values.length - nonNullValues.length,
    uniqueCount: uniqueValues.length,
    sampleValues: nonNullValues.slice(0, 10),
    statistics,
    quality,
  };
}

function detectColumnType(values: any[]): ColumnStatistics["type"] {
  if (values.length === 0) return "unknown";

  const sample = values.slice(0, Math.min(20, values.length));

  // Check for numbers
  if (sample.every((val) => !isNaN(Number(val)) && val !== "")) {
    return "number";
  }

  // Check for dates
  if (sample.every((val) => !isNaN(Date.parse(val)) && val !== "")) {
    return "date";
  }

  // Check for booleans
  const booleanValues = ["true", "false", "yes", "no", "1", "0"];
  if (
    sample.every((val) => booleanValues.includes(String(val).toLowerCase()))
  ) {
    return "boolean";
  }

  return "string";
}

function calculateNumericStatistics(values: any[]) {
  const numbers = values.map(Number).filter((n) => !isNaN(n));
  if (numbers.length === 0) return undefined;

  const sorted = [...numbers].sort((a, b) => a - b);
  const len = sorted.length;

  return {
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
    median:
      len % 2 === 0
        ? (sorted[len / 2 - 1] + sorted[len / 2]) / 2
        : sorted[Math.floor(len / 2)],
    stdDev: Math.sqrt(
      numbers.reduce(
        (sq, n) =>
          sq +
          Math.pow(n - numbers.reduce((a, b) => a + b, 0) / numbers.length, 2),
        0
      ) / numbers.length
    ),
    quartiles: {
      q1: sorted[Math.floor(len * 0.25)],
      q2: sorted[Math.floor(len * 0.5)],
      q3: sorted[Math.floor(len * 0.75)],
    },
  };
}

function calculateDataQuality(
  columnName: string,
  values: any[],
  nonNullValues: any[],
  uniqueValues: any[],
  type: ColumnStatistics["type"]
): ColumnStatistics["quality"] {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check for null values
  const nullPercentage = (values.length - nonNullValues.length) / values.length;
  if (nullPercentage > 0.1) {
    score -= Math.round(nullPercentage * 30);
    issues.push(`${Math.round(nullPercentage * 100)}% null values`);
    recommendations.push("Consider data cleaning or handling missing values");
  }

  // Check for duplicate values (for non-unique columns)
  const duplicatePercentage =
    (nonNullValues.length - uniqueValues.length) / nonNullValues.length;
  if (duplicatePercentage > 0.8 && type !== "number") {
    score -= 20;
    issues.push("High duplicate percentage");
    recommendations.push(
      "Consider if duplicates are intentional or need deduplication"
    );
  }

  // Check for type consistency
  if (type === "unknown") {
    score -= 30;
    issues.push("Mixed data types detected");
    recommendations.push("Standardize data format for better analysis");
  }

  // Check for outliers in numeric data
  if (type === "number" && nonNullValues.length > 10) {
    const numbers = nonNullValues.map(Number);
    const q1 = numbers.sort((a, b) => a - b)[Math.floor(numbers.length * 0.25)];
    const q3 = numbers.sort((a, b) => a - b)[Math.floor(numbers.length * 0.75)];
    const iqr = q3 - q1;
    const outliers = numbers.filter(
      (n) => n < q1 - 1.5 * iqr || n > q3 + 1.5 * iqr
    );

    if (outliers.length > numbers.length * 0.05) {
      score -= 10;
      issues.push(`${outliers.length} potential outliers`);
      recommendations.push("Review outliers for data accuracy");
    }
  }

  // Check for empty strings
  const emptyStringCount = nonNullValues.filter(
    (v) => String(v).trim() === ""
  ).length;
  if (emptyStringCount > 0) {
    score -= 5;
    issues.push(`${emptyStringCount} empty strings`);
    recommendations.push("Consider treating empty strings as null values");
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}
