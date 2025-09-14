"use client";

import React from "react";
import { ArrowUpDown, Database, Download } from "lucide-react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { ImportHistoryItem } from "../../types/importTimeline";

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparisonData: {
    leftData: any[];
    rightData: any[];
    leftItem: ImportHistoryItem;
    rightItem: ImportHistoryItem;
  } | null;
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  comparisonData,
}) => {
  if (!comparisonData) return null;

  const handleExport = () => {
    // Export comparison data
    const comparisonExport = {
      left: {
        dataSource: comparisonData.leftItem.dataSourceName,
        timestamp: comparisonData.leftItem.timestamp,
        recordCount: comparisonData.leftData.length,
        data: comparisonData.leftData,
      },
      right: {
        dataSource: comparisonData.rightItem.dataSourceName,
        timestamp: comparisonData.rightItem.timestamp,
        recordCount: comparisonData.rightData.length,
        data: comparisonData.rightData,
      },
      comparison: {
        recordDifference: Math.abs(
          comparisonData.leftData.length - comparisonData.rightData.length
        ),
        comparedAt: new Date().toISOString(),
      },
    };

    const blob = new Blob([JSON.stringify(comparisonExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparison-${comparisonData.leftItem.dataSourceName}-vs-${comparisonData.rightItem.dataSourceName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Data Sources"
      size="xl"
    >
      <div className="space-y-6">
        {/* Comparison Header */}
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm text-white/60 mb-1">Left Side</div>
              <div className="font-semibold text-white">
                {comparisonData.leftItem.dataSourceName}
              </div>
              <div className="text-xs text-white/60">
                {comparisonData.leftItem.timestamp.toLocaleString()}
              </div>
              <div className="text-xs text-white/60">
                {comparisonData.leftItem.recordCount.toLocaleString()} records
              </div>
            </div>
            <div className="text-white/40">
              <ArrowUpDown className="h-6 w-6" />
            </div>
            <div className="text-center">
              <div className="text-sm text-white/60 mb-1">Right Side</div>
              <div className="font-semibold text-white">
                {comparisonData.rightItem.dataSourceName}
              </div>
              <div className="text-xs text-white/60">
                {comparisonData.rightItem.timestamp.toLocaleString()}
              </div>
              <div className="text-xs text-white/60">
                {comparisonData.rightItem.recordCount.toLocaleString()} records
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Content */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Side */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Database className="h-5 w-5 mr-2 text-blue-400" />
              {comparisonData.leftItem.dataSourceName}
            </h3>
            <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-white/80 whitespace-pre-wrap">
                {JSON.stringify(comparisonData.leftData.slice(0, 10), null, 2)}
                {comparisonData.leftData.length > 10 && (
                  <div className="text-white/60 mt-2">
                    ... and {comparisonData.leftData.length - 10} more records
                  </div>
                )}
              </pre>
            </div>
          </div>

          {/* Right Side */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Database className="h-5 w-5 mr-2 text-green-400" />
              {comparisonData.rightItem.dataSourceName}
            </h3>
            <div className="bg-white/5 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-white/80 whitespace-pre-wrap">
                {JSON.stringify(comparisonData.rightData.slice(0, 10), null, 2)}
                {comparisonData.rightData.length > 10 && (
                  <div className="text-white/60 mt-2">
                    ... and {comparisonData.rightData.length - 10} more records
                  </div>
                )}
              </pre>
            </div>
          </div>
        </div>

        {/* Comparison Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {comparisonData.leftData.length}
            </div>
            <div className="text-sm text-white/60">Left Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {comparisonData.rightData.length}
            </div>
            <div className="text-sm text-white/60">Right Records</div>
          </div>
          <div className="text-center">
            <div
              className={`text-2xl font-bold ${
                comparisonData.leftData.length ===
                comparisonData.rightData.length
                  ? "text-green-400"
                  : "text-orange-400"
              }`}
            >
              {Math.abs(
                comparisonData.leftData.length - comparisonData.rightData.length
              )}
            </div>
            <div className="text-sm text-white/60">Difference</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Comparison
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ComparisonModal;
