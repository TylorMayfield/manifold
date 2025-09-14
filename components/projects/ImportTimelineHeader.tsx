"use client";

import React from "react";
import { Clock, RefreshCw, GitBranch, ArrowUpDown } from "lucide-react";
import Button from "../ui/Button";

interface ImportTimelineHeaderProps {
  importHistoryCount: number;
  selectedItemsCount: number;
  loading: boolean;
  onRefresh: () => void;
  onViewDiffs: () => void;
  onCompare: () => void;
  canCompare: boolean;
}

const ImportTimelineHeader: React.FC<ImportTimelineHeaderProps> = ({
  importHistoryCount,
  selectedItemsCount,
  loading,
  onRefresh,
  onViewDiffs,
  onCompare,
  canCompare,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-subheading text-white">Import Timeline</h3>
          <span className="text-white/60 text-sm">
            {importHistoryCount} import{importHistoryCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onViewDiffs}>
            <GitBranch className="h-4 w-4 mr-2" />
            View Diffs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCompare}
            disabled={!canCompare}
            className={canCompare ? "border-blue-400 text-blue-400" : ""}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Compare ({selectedItemsCount}/2)
          </Button>
        </div>
      </div>

      {/* Instructions */}
      {importHistoryCount > 1 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <ArrowUpDown className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-blue-400 font-medium mb-1">
                Compare Data Sources
              </h4>
              <p className="text-blue-300 text-sm">
                Click on any two import items to select them, then use the
                "Compare" button to view side-by-side differences.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportTimelineHeader;
