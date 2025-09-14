"use client";

import {
  TrendingUp,
  TrendingDown,
  Database,
  Users,
  Calendar,
  BarChart3,
} from "lucide-react";

interface SummaryCard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "purple" | "orange" | "red";
}

interface DataSummaryCardsProps {
  data: any[];
  columns: string[];
  className?: string;
}

export default function DataSummaryCards({
  data,
  columns,
  className = "",
}: DataSummaryCardsProps) {
  // Calculate summary statistics
  const summaryCards: SummaryCard[] = [
    {
      title: "Total Records",
      value: data.length.toLocaleString(),
      icon: <Database className="h-5 w-5" />,
      color: "blue",
    },
    {
      title: "Columns",
      value: columns.length,
      icon: <BarChart3 className="h-5 w-5" />,
      color: "purple",
    },
    {
      title: "Last Updated",
      value: new Date().toLocaleDateString(),
      icon: <Calendar className="h-5 w-5" />,
      color: "orange",
    },
  ];

  const getCardStyles = (color?: string) => {
    const colorMap = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600",
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
      red: "from-red-500 to-red-600",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {summaryCards.map((card, index) => (
        <div key={index} className="card-interactive rounded-xl p-6 group">
          <div className="flex items-center justify-between mb-4">
            <div
              className={`p-2 rounded-lg bg-gradient-to-r ${getCardStyles(
                card.color
              )}`}
            >
              {card.icon}
            </div>
            {card.change !== undefined && (
              <div
                className={`flex items-center text-sm ${
                  card.change >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {card.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                {Math.abs(card.change).toFixed(1)}%
              </div>
            )}
          </div>

          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{card.value}</h3>
            <p className="text-sm text-white text-opacity-70 mb-2">
              {card.title}
            </p>
            {card.changeLabel && (
              <p className="text-xs text-white text-opacity-50">
                {card.changeLabel}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
