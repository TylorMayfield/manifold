"use client";

import { useState } from "react";
import { Download, FileImage, FileText, Settings, X } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";
import Textarea from "./Textarea";
import { ExportOptions, ChartExportData } from "../../lib/utils/chartExport";

interface ChartExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  chartData?: ChartExportData;
  defaultFormat?: "png" | "jpg" | "pdf";
}

export default function ChartExportModal({
  isOpen,
  onClose,
  onExport,
  chartData,
  defaultFormat = "png",
}: ChartExportModalProps) {
  const [format, setFormat] = useState<"png" | "jpg" | "pdf">(defaultFormat);
  const [filename, setFilename] = useState("");
  const [title, setTitle] = useState(chartData?.title || "");
  const [description, setDescription] = useState("");
  const [quality, setQuality] = useState(1);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!chartData) return;

    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        filename: filename || undefined,
        title: title || chartData.title,
        description: description || undefined,
        quality,
        includeTimestamp,
      };

      await onExport(options);
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      // You could add toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    {
      value: "png" as const,
      label: "PNG",
      description: "High quality image with transparency support",
      icon: FileImage,
    },
    {
      value: "jpg" as const,
      label: "JPEG",
      description: "Compressed image format, smaller file size",
      icon: FileImage,
    },
    {
      value: "pdf" as const,
      label: "PDF",
      description: "Document format with metadata and text",
      icon: FileText,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Chart"
      size="lg"
      showCloseButton={false}
    >
      <div className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-white text-opacity-90">
            Export Format
          </label>
          <div className="grid grid-cols-1 gap-3">
            {formatOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setFormat(option.value)}
                  className={`p-4 rounded-xl text-left transition-all ${
                    format === option.value
                      ? "glass-button-primary"
                      : "glass-button hover:scale-105"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg glass-button-primary">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{option.label}</p>
                      <p className="text-white/60 text-sm">
                        {option.description}
                      </p>
                    </div>
                    {format === option.value && (
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* File Details */}
        <div className="space-y-4">
          <div className="flex items-center">
            <Settings className="h-5 w-5 text-white text-opacity-80 mr-3" />
            <h3 className="text-lg font-semibold text-white">
              Export Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="chart_export"
              helperText="Leave empty for auto-generated name"
            />

            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chart Title"
            />
          </div>

          <Textarea
            label="Description (PDF only)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description for PDF exports..."
            rows={3}
          />

          {/* Quality Setting (for image formats) */}
          {format !== "pdf" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white text-opacity-90">
                Quality: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-white text-opacity-60">
                <span>Lower file size</span>
                <span>Higher quality</span>
              </div>
            </div>
          )}

          {/* Timestamp Option */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="includeTimestamp"
              checked={includeTimestamp}
              onChange={(e) => setIncludeTimestamp(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label
              htmlFor="includeTimestamp"
              className="text-sm text-white text-opacity-90"
            >
              Include timestamp in filename
            </label>
          </div>
        </div>

        {/* Chart Preview Info */}
        {chartData?.metadata && (
          <div className="card p-4">
            <h4 className="text-sm font-medium text-white text-opacity-70 mb-2">
              Chart Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-white text-opacity-60">Type:</span>
                <span className="text-white ml-2">
                  {chartData.metadata.chartType}
                </span>
              </div>
              <div>
                <span className="text-white text-opacity-60">Data Points:</span>
                <span className="text-white ml-2">
                  {chartData.metadata.dataPoints.toLocaleString()}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-white text-opacity-60">Columns:</span>
                <span className="text-white ml-2">
                  {chartData.metadata.columns.join(", ")}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-white border-opacity-10">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            icon={<Download className="h-4 w-4" />}
          >
            {isExporting ? "Exporting..." : `Export as ${format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
