"use client";

import React, { useState } from "react";
import {
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Archive,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import { DataSource } from "../../types";

interface BulkOperationsProps {
  selectedDataSources: DataSource[];
  onBulkDelete: (ids: string[]) => void;
  onBulkStart: (ids: string[]) => void;
  onBulkStop: (ids: string[]) => void;
  onBulkRefresh: (ids: string[]) => void;
  onBulkExport: (ids: string[]) => void;
  onBulkDuplicate: (ids: string[]) => void;
  onBulkArchive: (ids: string[]) => void;
  className?: string;
}

interface BulkOperation {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: "primary" | "outline" | "ghost" | "destructive";
  action: () => void;
  confirmation?: {
    title: string;
    message: string;
    confirmText: string;
  };
}

export default function BulkOperations({
  selectedDataSources,
  onBulkDelete,
  onBulkStart,
  onBulkStop,
  onBulkRefresh,
  onBulkExport,
  onBulkDuplicate,
  onBulkArchive,
  className = "",
}: BulkOperationsProps) {
  const [showConfirmation, setShowConfirmation] = useState<{
    operation: BulkOperation;
    action: () => void;
  } | null>(null);

  const selectedIds = selectedDataSources.map((ds) => ds.id);
  const hasSelection = selectedDataSources.length > 0;

  const operations: BulkOperation[] = [
    {
      id: "start",
      label: "Start All",
      icon: <Play className="h-4 w-4" />,
      variant: "primary",
      action: () => onBulkStart(selectedIds),
    },
    {
      id: "stop",
      label: "Stop All",
      icon: <Pause className="h-4 w-4" />,
      variant: "outline",
      action: () => onBulkStop(selectedIds),
    },
    {
      id: "refresh",
      label: "Refresh All",
      icon: <RefreshCw className="h-4 w-4" />,
      variant: "outline",
      action: () => onBulkRefresh(selectedIds),
    },
    {
      id: "export",
      label: "Export All",
      icon: <Download className="h-4 w-4" />,
      variant: "outline",
      action: () => onBulkExport(selectedIds),
    },
    {
      id: "duplicate",
      label: "Duplicate",
      icon: <Copy className="h-4 w-4" />,
      variant: "ghost",
      action: () => onBulkDuplicate(selectedIds),
    },
    {
      id: "archive",
      label: "Archive",
      icon: <Archive className="h-4 w-4" />,
      variant: "ghost",
      action: () => onBulkArchive(selectedIds),
      confirmation: {
        title: "Archive Data Sources",
        message:
          "Are you sure you want to archive the selected data sources? They will be moved to the archive and can be restored later.",
        confirmText: "Archive",
      },
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      variant: "destructive",
      action: () => onBulkDelete(selectedIds),
      confirmation: {
        title: "Delete Data Sources",
        message:
          "Are you sure you want to permanently delete the selected data sources? This action cannot be undone.",
        confirmText: "Delete",
      },
    },
  ];

  const handleOperation = (operation: BulkOperation) => {
    if (operation.confirmation) {
      setShowConfirmation({ operation, action: operation.action });
    } else {
      operation.action();
    }
  };

  const confirmAction = () => {
    if (showConfirmation) {
      showConfirmation.action();
      setShowConfirmation(null);
    }
  };

  if (!hasSelection) {
    return null;
  }

  return (
    <>
      <div
        className={`flex items-center space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg ${className}`}
      >
        <div className="flex items-center space-x-2 text-blue-400">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">
            {selectedDataSources.length} data source
            {selectedDataSources.length !== 1 ? "s" : ""} selected
          </span>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          {operations.map((operation) => (
            <Button
              key={operation.id}
              onClick={() => handleOperation(operation)}
              variant={operation.variant}
              size="sm"
              icon={operation.icon}
              disabled={!hasSelection}
            >
              {operation.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <Modal
          isOpen={true}
          onClose={() => setShowConfirmation(null)}
          size="sm"
          title=""
          showCloseButton={false}
        >
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <h3 className="text-lg font-medium text-white mb-2">
              {showConfirmation.operation.confirmation?.title}
            </h3>

            <p className="text-sm text-white/80 mb-6">
              {showConfirmation.operation.confirmation?.message}
            </p>

            <div className="flex justify-center space-x-3">
              <Button
                onClick={() => setShowConfirmation(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button onClick={confirmAction} variant="destructive">
                {showConfirmation.operation.confirmation?.confirmText}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
