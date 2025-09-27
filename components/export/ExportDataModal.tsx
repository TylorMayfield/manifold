"use client";

import React, { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Database,
  Settings,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Filter,
  Users,
  BarChart3,
} from "lucide-react";
import { clientLogger } from "../../lib/utils/ClientLogger";
import { DataSource } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataSources: DataSource[];
  projectId: string;
}

interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  description: string;
  icon: React.ReactNode;
}

interface ExportOptions {
  format: string;
  selectedDataSources: string[];
  includeSchema: boolean;
  includeMetadata: boolean;
  dateRange: {
    enabled: boolean;
    start: string;
    end: string;
  };
  filters: {
    enabled: boolean;
    conditions: Array<{
      column: string;
      operator: string;
      value: string;
    }>;
  };
  compression: boolean;
  splitFiles: boolean;
  maxRecords: number;
}

interface ExportProgress {
  stage: string;
  progress: number;
  message: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: "csv",
    name: "CSV",
    extension: ".csv",
    description: "Comma-separated values for Excel and data analysis",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: "json",
    name: "JSON",
    extension: ".json",
    description: "JavaScript Object Notation for APIs and web apps",
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: "sqlite",
    name: "SQLite",
    extension: ".db",
    description: "Lightweight database for applications",
    icon: <Database className="h-5 w-5" />,
  },
  {
    id: "sql",
    name: "SQL Dump",
    extension: ".sql",
    description: "SQL statements for database import",
    icon: <Database className="h-5 w-5" />,
  },
];

export default function ExportDataModal({
  isOpen,
  onClose,
  dataSources,
  projectId,
}: ExportDataModalProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    selectedDataSources: [],
    includeSchema: true,
    includeMetadata: true,
    dateRange: {
      enabled: false,
      start: "",
      end: "",
    },
    filters: {
      enabled: false,
      conditions: [],
    },
    compression: false,
    splitFiles: false,
    maxRecords: 10000,
  });

  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && dataSources.length > 0) {
      // Auto-select all data sources
      setExportOptions((prev) => ({
        ...prev,
        selectedDataSources: dataSources.map((ds) => ds.id),
      }));
    }
  }, [isOpen, dataSources]);

  const handleExport = async () => {
    if (exportOptions.selectedDataSources.length === 0) {
      clientLogger.warn(
        "No data sources selected for export",
        "data-processing",
        {},
        "ExportDataModal"
      );
      return;
    }

    setIsExporting(true);
    setExportComplete(false);
    setDownloadLinks([]);
    setExportProgress({
      stage: "preparing",
      progress: 0,
      message: "Preparing export...",
    });

    try {
      const selectedSources = dataSources.filter((ds) =>
        exportOptions.selectedDataSources.includes(ds.id)
      );

      clientLogger.info(
        "Starting data export",
        "data-processing",
        {
          format: exportOptions.format,
          dataSourceCount: selectedSources.length,
          projectId,
        },
        "ExportDataModal"
      );

      // Simulate export process with progress updates
      const stages = [
        { stage: "preparing", progress: 10, message: "Preparing export..." },
        {
          stage: "fetching",
          progress: 25,
          message: "Fetching data from sources...",
        },
        { stage: "processing", progress: 50, message: "Processing data..." },
        { stage: "formatting", progress: 75, message: "Formatting data..." },
        { stage: "finalizing", progress: 90, message: "Finalizing export..." },
        { stage: "complete", progress: 100, message: "Export complete!" },
      ];

      for (const stage of stages) {
        setExportProgress(stage);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      // Generate mock download links
      const mockLinks = selectedSources.map((ds, index) => {
        const format = EXPORT_FORMATS.find(
          (f) => f.id === exportOptions.format
        );
        return `${ds.name}_export_${new Date().toISOString().split("T")[0]}${
          format?.extension
        }`;
      });

      setDownloadLinks(mockLinks);
      setExportComplete(true);

      clientLogger.success(
        "Data export completed",
        "data-processing",
        {
          format: exportOptions.format,
          filesGenerated: mockLinks.length,
        },
        "ExportDataModal"
      );
    } catch (error) {
      clientLogger.error(
        "Data export failed",
        "data-processing",
        { error },
        "ExportDataModal"
      );
      setExportProgress({
        stage: "error",
        progress: 0,
        message: "Export failed. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (filename: string) => {
    // In a real implementation, this would download the actual file
    clientLogger.info(
      "File download initiated",
      "data-processing",
      { filename },
      "ExportDataModal"
    );

    // Create a mock download
    const mockData = `Mock ${exportOptions.format.toUpperCase()} export data for ${filename}`;
    const blob = new Blob([mockData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleDataSource = (dataSourceId: string) => {
    setExportOptions((prev) => ({
      ...prev,
      selectedDataSources: prev.selectedDataSources.includes(dataSourceId)
        ? prev.selectedDataSources.filter((id) => id !== dataSourceId)
        : [...prev.selectedDataSources, dataSourceId],
    }));
  };

  const addFilterCondition = () => {
    setExportOptions((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        conditions: [
          ...prev.filters.conditions,
          { column: "", operator: "=", value: "" },
        ],
      },
    }));
  };

  const removeFilterCondition = (index: number) => {
    setExportOptions((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        conditions: prev.filters.conditions.filter((_, i) => i !== index),
      },
    }));
  };

  const updateFilterCondition = (
    index: number,
    field: string,
    value: string
  ) => {
    setExportOptions((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        conditions: prev.filters.conditions.map((condition, i) =>
          i === index ? { ...condition, [field]: value } : condition
        ),
      },
    }));
  };

  const selectedFormat = EXPORT_FORMATS.find(
    (f) => f.id === exportOptions.format
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Data" size="lg">
      <div className="space-y-6">
        {/* Export Format Selection */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">Export Format</h3>
          <div className="grid grid-cols-2 gap-3">
            {EXPORT_FORMATS.map((format) => (
              <div
                key={format.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  exportOptions.format === format.id
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() =>
                  setExportOptions((prev) => ({ ...prev, format: format.id }))
                }
              >
                <div className="flex items-center space-x-3">
                  <div className="text-blue-400">{format.icon}</div>
                  <div>
                    <h4 className="text-white font-medium">{format.name}</h4>
                    <p className="text-white/60 text-sm">
                      {format.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Sources Selection */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-medium">Select Data Sources</h3>
            <span className="text-white/60 text-sm">
              {exportOptions.selectedDataSources.length} of {dataSources.length}{" "}
              selected
            </span>
          </div>

          <div className="space-y-2">
            {dataSources.map((dataSource) => (
              <div
                key={dataSource.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  exportOptions.selectedDataSources.includes(dataSource.id)
                    ? "border-green-500/50 bg-green-500/10"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => toggleDataSource(dataSource.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Database className="h-5 w-5 text-blue-400" />
                    <div>
                      <h4 className="text-white font-medium">
                        {dataSource.name}
                      </h4>
                      <p className="text-white/60 text-sm">
                        {dataSource.type} •{" "}
                        {dataSource.config.mockConfig?.recordCount || 0} records
                      </p>
                    </div>
                  </div>
                  {exportOptions.selectedDataSources.includes(
                    dataSource.id
                  ) && <CheckCircle className="h-5 w-5 text-green-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="text-white font-medium mb-4">Export Options</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSchema}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeSchema: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="text-white/70">
                  Include schema information
                </span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeMetadata: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="text-white/70">Include metadata</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.compression}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      compression: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="text-white/70">Compress files</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={exportOptions.splitFiles}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      splitFiles: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                />
                <span className="text-white/70">Split large files</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Max Records per File
                </label>
                <input
                  type="number"
                  value={exportOptions.maxRecords}
                  onChange={(e) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      maxRecords: parseInt(e.target.value) || 10000,
                    }))
                  }
                  className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={exportOptions.dateRange.enabled}
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        dateRange: {
                          ...prev.dateRange,
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                  />
                  <span className="text-white/70">Filter by date range</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && exportProgress && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-4">
              {exportProgress.stage === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-400" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              )}
              <h3 className="text-white font-medium">
                {exportProgress.message}
              </h3>
            </div>

            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress.progress}%` }}
              />
            </div>
            <p className="text-white/60 text-sm">
              {exportProgress.progress}% complete
            </p>
          </div>
        )}

        {/* Export Complete */}
        {exportComplete && downloadLinks.length > 0 && (
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <h3 className="text-white font-medium">Export Complete!</h3>
            </div>

            <div className="space-y-2">
              <p className="text-white/70 text-sm mb-3">
                {downloadLinks.length} file(s) generated successfully:
              </p>
              {downloadLinks.map((filename, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">{filename}</span>
                  </div>
                  <Button size="sm" onClick={() => downloadFile(filename)}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            loading={isExporting}
            disabled={exportOptions.selectedDataSources.length === 0}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Export
          </Button>
        </div>
      </div>
    </Modal>
  );
}
