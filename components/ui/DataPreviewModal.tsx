"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Eye,
  Table,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";
import { logger } from "../../lib/utils/logger";

export interface DataPreviewRow {
  [key: string]: any;
}

export interface DataPreviewColumn {
  name: string;
  type: "string" | "number" | "date" | "boolean" | "unknown";
  nullable: boolean;
  unique: boolean;
  sampleValues: any[];
  statistics?: {
    min?: number;
    max?: number;
    avg?: number;
    count: number;
    nullCount: number;
    uniqueCount: number;
  };
}

export interface DataPreviewInfo {
  fileName: string;
  fileSize: number;
  fileType: string;
  totalRows: number;
  totalColumns: number;
  encoding?: string;
  delimiter?: string;
  hasHeader: boolean;
  previewRows: DataPreviewRow[];
  columns: DataPreviewColumn[];
  warnings: string[];
  errors: string[];
}

interface DataPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (previewInfo: DataPreviewInfo) => void;
  file: File;
  maxPreviewRows?: number;
  className?: string;
}

export default function DataPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  file,
  maxPreviewRows = 100,
  className = "",
}: DataPreviewModalProps) {
  const [previewInfo, setPreviewInfo] = useState<DataPreviewInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filteredData, setFilteredData] = useState<DataPreviewRow[]>([]);

  const rowsPerPage = 20;

  // Parse file and generate preview
  useEffect(() => {
    if (isOpen && file) {
      parseFile();
    }
  }, [isOpen, file]);

  const parseFile = async () => {
    setLoading(true);
    setError(null);

    try {
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      let parsedData: DataPreviewInfo;

      switch (fileExtension) {
        case "csv":
          parsedData = await parseCSVFile();
          break;
        case "json":
          parsedData = await parseJSONFile();
          break;
        case "sql":
          parsedData = await parseSQLFile();
          break;
        default:
          throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      setPreviewInfo(parsedData);
      setSelectedColumns(parsedData.columns.map((col) => col.name));

      logger.success("File preview generated", "file-import", {
        fileName: file.name,
        rows: parsedData.totalRows,
        columns: parsedData.totalColumns,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to parse file";
      setError(errorMessage);
      logger.error("File preview failed", "file-import", {
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const parseCSVFile = async (): Promise<DataPreviewInfo> => {
    const text = await file.text();
    const lines = text.split("\n");
    const hasHeader = true; // Assume first row is header
    const delimiter = detectDelimiter(text);

    const headers = lines[0]
      .split(delimiter)
      .map((h) => h.trim().replace(/['"]/g, ""));
    const dataRows = lines
      .slice(1, maxPreviewRows + 1)
      .filter((line) => line.trim());

    const columns = analyzeColumns(headers, dataRows, delimiter);
    const previewRows = dataRows.map((line, index) => {
      const values = parseCSVLine(line, delimiter);
      const row: DataPreviewRow = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || null;
      });
      return row;
    });

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: "csv",
      totalRows: lines.length - 1,
      totalColumns: headers.length,
      delimiter,
      hasHeader,
      previewRows,
      columns,
      warnings: generateWarnings(columns, previewRows),
      errors: [],
    };
  };

  const parseJSONFile = async (): Promise<DataPreviewInfo> => {
    const text = await file.text();
    const data = JSON.parse(text);

    let rows: any[];
    if (Array.isArray(data)) {
      rows = data;
    } else if (typeof data === "object") {
      // Try to find array property
      const arrayProps = Object.keys(data).filter((key) =>
        Array.isArray(data[key])
      );
      if (arrayProps.length > 0) {
        rows = data[arrayProps[0]];
      } else {
        rows = [data]; // Single object
      }
    } else {
      throw new Error("JSON file must contain an object or array");
    }

    const previewRows = rows.slice(0, maxPreviewRows);
    const allKeys = [...new Set(rows.flatMap((row) => Object.keys(row)))];

    const columns = analyzeColumns(allKeys, rows);
    const totalRows = rows.length;

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: "json",
      totalRows,
      totalColumns: allKeys.length,
      hasHeader: true,
      previewRows,
      columns,
      warnings: generateWarnings(columns, previewRows),
      errors: [],
    };
  };

  const parseSQLFile = async (): Promise<DataPreviewInfo> => {
    const text = await file.text();
    // For SQL files, we'll create a mock preview since actual parsing is complex
    const lines = text.split("\n");
    const insertStatements = lines.filter((line) =>
      line.trim().toLowerCase().startsWith("insert into")
    );

    return {
      fileName: file.name,
      fileSize: file.size,
      fileType: "sql",
      totalRows: insertStatements.length,
      totalColumns: 0, // Will be determined during actual import
      hasHeader: false,
      previewRows: [],
      columns: [],
      warnings: ["SQL files will be processed during import"],
      errors: [],
    };
  };

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split("\n")[0];
    const delimiters = [",", ";", "\t", "|"];
    let bestDelimiter = ",";
    let maxCount = 0;

    for (const delimiter of delimiters) {
      const count = (
        firstLine.match(
          new RegExp(delimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
        ) || []
      ).length;
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = delimiter;
      }
    }

    return bestDelimiter;
  };

  const parseCSVLine = (line: string, delimiter: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const analyzeColumns = (
    headers: string[],
    dataRows: any[],
    delimiter?: string
  ): DataPreviewColumn[] => {
    return headers.map((header) => {
      const values = dataRows
        .map((row) => {
          if (typeof row === "string" && delimiter) {
            return parseCSVLine(row, delimiter)[headers.indexOf(header)];
          }
          return row[header];
        })
        .filter((val) => val !== undefined && val !== null && val !== "");

      const type = detectColumnType(values);
      const sampleValues = values.slice(0, 5);
      const statistics =
        type === "number" ? calculateStatistics(values) : undefined;

      return {
        name: header,
        type,
        nullable: values.length < dataRows.length,
        unique: new Set(values).size === values.length,
        sampleValues,
        statistics,
      };
    });
  };

  const detectColumnType = (values: any[]): DataPreviewColumn["type"] => {
    if (values.length === 0) return "unknown";

    const sample = values.slice(0, Math.min(10, values.length));

    // Check for numbers
    if (sample.every((val) => !isNaN(Number(val)) && val !== "")) {
      return "number";
    }

    // Check for dates
    if (sample.every((val) => !isNaN(Date.parse(val)))) {
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
  };

  const calculateStatistics = (values: any[]) => {
    const numbers = values.map(Number).filter((n) => !isNaN(n));
    if (numbers.length === 0) return undefined;

    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      avg: numbers.reduce((a, b) => a + b, 0) / numbers.length,
      count: numbers.length,
      nullCount: values.length - numbers.length,
      uniqueCount: new Set(numbers).size,
    };
  };

  const generateWarnings = (
    columns: DataPreviewColumn[],
    rows: DataPreviewRow[]
  ): string[] => {
    const warnings: string[] = [];

    columns.forEach((col) => {
      if (
        col.nullable &&
        col.statistics &&
        col.statistics.nullCount > rows.length * 0.1
      ) {
        warnings.push(
          `Column "${col.name}" has ${
            col.statistics.nullCount
          } null values (${Math.round(
            (col.statistics.nullCount / rows.length) * 100
          )}%)`
        );
      }

      if (col.type === "unknown") {
        warnings.push(`Column "${col.name}" has mixed data types`);
      }
    });

    if (rows.length < 10) {
      warnings.push("Very small dataset - preview may not be representative");
    }

    return warnings;
  };

  // Filter data based on search and column selection
  useEffect(() => {
    if (!previewInfo) return;

    let filtered = previewInfo.previewRows;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [previewInfo, searchTerm, selectedColumns]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleConfirm = () => {
    if (previewInfo) {
      onConfirm(previewInfo);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Data Preview" size="xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
            <p className="text-white text-opacity-70">Analyzing file...</p>
          </div>
        </div>
      </Modal>
    );
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Preview Error" size="lg">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Failed to Preview File
          </h3>
          <p className="text-white text-opacity-70 mb-6">{error}</p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </Modal>
    );
  }

  if (!previewInfo) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data Preview" size="xl">
      <div className="space-y-6">
        {/* File Info */}
        <div className="card p-4">
          <div className="flex items-center space-x-3 mb-3">
            <FileText className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              File Information
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-white text-opacity-60">File:</span>
              <p className="text-white font-medium">{previewInfo.fileName}</p>
            </div>
            <div>
              <span className="text-white text-opacity-60">Size:</span>
              <p className="text-white font-medium">
                {formatFileSize(previewInfo.fileSize)}
              </p>
            </div>
            <div>
              <span className="text-white text-opacity-60">Rows:</span>
              <p className="text-white font-medium">
                {previewInfo.totalRows.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-white text-opacity-60">Columns:</span>
              <p className="text-white font-medium">
                {previewInfo.totalColumns}
              </p>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {previewInfo.warnings.length > 0 && (
          <div className="card p-4 border-yellow-500 border-opacity-30">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Warnings</h3>
            </div>
            <ul className="space-y-1">
              {previewInfo.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-400 text-sm">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data Preview */}
        <div className="card">
          <div className="p-4 border-b border-white border-opacity-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Table className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  Data Preview
                </h3>
                <span className="text-sm text-white text-opacity-60">
                  (Showing {paginatedData.length} of {filteredData.length} rows)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48"
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
            </div>

            {/* Column Selection */}
            <div className="flex flex-wrap gap-2 mb-4">
              {previewInfo.columns.map((column) => (
                <button
                  key={column.name}
                  onClick={() => {
                    setSelectedColumns((prev) =>
                      prev.includes(column.name)
                        ? prev.filter((col) => col !== column.name)
                        : [...prev, column.name]
                    );
                  }}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedColumns.includes(column.name)
                      ? "bg-purple-500 text-white"
                      : "bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20"
                  }`}
                >
                  {column.name} ({column.type})
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white border-opacity-10">
                  {previewInfo.columns
                    .filter((col) => selectedColumns.includes(col.name))
                    .map((column) => (
                      <th
                        key={column.name}
                        className="px-3 py-2 text-left text-white text-opacity-70"
                      >
                        <div className="flex items-center space-x-2">
                          <span>{column.name}</span>
                          <span className="text-xs text-white text-opacity-50">
                            ({column.type})
                          </span>
                        </div>
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-white border-opacity-5 hover:bg-white hover:bg-opacity-5"
                  >
                    {previewInfo.columns
                      .filter((col) => selectedColumns.includes(col.name))
                      .map((column) => (
                        <td
                          key={column.name}
                          className="px-3 py-2 text-white text-opacity-80"
                        >
                          {row[column.name] !== null &&
                          row[column.name] !== undefined ? (
                            String(row[column.name])
                          ) : (
                            <span className="text-white text-opacity-40 italic">
                              null
                            </span>
                          )}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-white border-opacity-10">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white text-opacity-60">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    icon={<ChevronLeft className="h-4 w-4" />}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    icon={<ChevronRight className="h-4 w-4" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            icon={<CheckCircle className="h-4 w-4" />}
          >
            Import Data
          </Button>
        </div>
      </div>
    </Modal>
  );
}
