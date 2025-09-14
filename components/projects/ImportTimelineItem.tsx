"use client";

import React from "react";
import {
  FileText,
  Database,
  Download,
  TrendingUp,
  ArrowUpDown,
  Minus,
  Eye,
  Calendar,
  Hash,
} from "lucide-react";
import Button from "../ui/Button";
import { ImportHistoryItem } from "../../types/importTimeline";

interface ImportTimelineItemProps {
  item: ImportHistoryItem;
  index: number;
  totalItems: number;
  isSelected: boolean;
  onSelect: (item: ImportHistoryItem) => void;
  onViewDiff: (item: ImportHistoryItem) => void;
  selectionNumber?: number;
}

const ImportTimelineItem: React.FC<ImportTimelineItemProps> = ({
  item,
  index,
  totalItems,
  isSelected,
  onSelect,
  onViewDiff,
  selectionNumber,
}) => {
  const getDataSourceIcon = (type: string) => {
    switch (type) {
      case "file":
        return FileText;
      case "mysql":
        return Database;
      case "mock":
        return Database;
      case "custom_script":
        return Download;
      default:
        return Database;
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case "new":
        return TrendingUp;
      case "update":
        return ArrowUpDown;
      case "reimport":
        return Minus;
      default:
        return Minus;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case "new":
        return "text-green-400";
      case "update":
        return "text-yellow-400";
      case "reimport":
        return "text-blue-400";
      default:
        return "text-white/60";
    }
  };

  const DataSourceIcon = getDataSourceIcon(item.dataSourceType);
  const ChangeIcon = getChangeIcon(item.changeType);
  const changeColor = getChangeColor(item.changeType);

  return (
    <div
      className={`flex items-center space-x-4 p-4 border rounded-lg transition-all cursor-pointer ${
        isSelected
          ? "bg-blue-500/20 border-blue-400/50 ring-2 ring-blue-400/30"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
      onClick={() => onSelect(item)}
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div
          className={`w-3 h-3 rounded-full ${
            isSelected ? "bg-blue-400 ring-2 ring-blue-400/50" : "bg-blue-400"
          }`}
        ></div>
        {index < totalItems - 1 && (
          <div className="w-px h-8 bg-white/20 mt-2"></div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && selectionNumber && (
        <div className="flex items-center justify-center w-6 h-6 bg-blue-400 rounded-full">
          <span className="text-white text-xs font-bold">
            {selectionNumber}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-2">
          <DataSourceIcon className="h-4 w-4 text-white/60" />
          <span className="text-white font-medium truncate">
            {item.dataSourceName}
          </span>
          <span className="text-white/40 text-xs px-2 py-1 bg-white/10 rounded">
            {item.dataSourceType}
          </span>
          <ChangeIcon className={`h-4 w-4 ${changeColor}`} />
          <span className={`text-xs ${changeColor} capitalize`}>
            {item.changeType}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-sm text-white/60">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{item.timestamp.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Hash className="h-3 w-3" />
            <span>{item.recordCount.toLocaleString()} records</span>
          </div>
          {item.previousRecordCount !== undefined && (
            <div className="flex items-center space-x-1">
              <span className="text-xs">
                ({item.previousRecordCount > item.recordCount ? "-" : "+"}
                {Math.abs(
                  item.recordCount - item.previousRecordCount
                ).toLocaleString()}
                )
              </span>
            </div>
          )}
          {item.metadata?.columns && (
            <div className="flex items-center space-x-1">
              <span>{item.metadata.columns} columns</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        {item.changeType !== "new" && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onViewDiff(item);
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Diff
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImportTimelineItem;
