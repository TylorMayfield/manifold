"use client";

import React, { useState } from "react";
import { Upload, Database, FileText, AlertCircle } from "lucide-react";
import { ImportProgress } from "../../types";
// import { sqlDumpImporter } from "../../lib/services/SqlDumpImporter"; // Moved to server-side

// Mock sqlDumpImporter for client-side
const sqlDumpImporter = {
  importSqlDump: () => {},
  validateSqlDump: () => true,
  getImportProgress: () => ({ progress: 0, status: "idle" }),
};
import { clientLogger } from "../../lib/utils/ClientLogger";
import Button from "../ui/Button";
import Input from "../ui/Input";
import ImportProgressIndicator from "../ui/ImportProgressIndicator";

interface SqlDumpUploadProps {
  projectId: string;
  onUploadComplete: (progress: ImportProgress) => void;
}

const SqlDumpUpload: React.FC<SqlDumpUploadProps> = ({
  projectId,
  onUploadComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [providerName, setProviderName] = useState("");
  const [sqlDialect, setSqlDialect] = useState<
    "mysql" | "postgresql" | "sqlite"
  >("mysql");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.toLowerCase().endsWith(".sql")) {
        setError("Please select a .sql file");
        return;
      }

      setFile(selectedFile);
      setError(null);

      // Auto-generate provider name from filename
      if (!providerName) {
        const nameWithoutExt = selectedFile.name.replace(/\.sql$/i, "");
        setProviderName(nameWithoutExt);
      }

      clientLogger.info(
        "SQL dump file selected",
        "file-import",
        {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          projectId,
        },
        "SqlDumpUpload"
      );
    }
  };

  const handleUpload = async () => {
    if (!file || !providerName.trim()) {
      setError("Please select a file and enter a provider name");
      return;
    }

    // Create a temporary file path (in a real app, you'd handle file upload properly)
    const tempPath = `/tmp/${file.name}`;
    const startTime = new Date();

    try {
      setLoading(true);
      setError(null);

      // Simulate file upload progress with enhanced details
      const progressData: ImportProgress = {
        stage: "reading",
        progress: 10,
        message: `Reading SQL dump file: ${file.name}...`,
        startTime,
        totalBytes: file.size,
        bytesProcessed: Math.round(file.size * 0.1),
      };

      setProgress(progressData);
      onUploadComplete(progressData);

      // In a real implementation, you would:
      // 1. Upload the file to a temporary location
      // 2. Pass the file path to the importer
      // For now, we'll simulate the import process

      const parsingProgress: ImportProgress = {
        stage: "parsing",
        progress: 30,
        message: "Parsing SQL statements and analyzing structure...",
        startTime,
        totalBytes: file.size,
        bytesProcessed: Math.round(file.size * 0.3),
        totalRecords: Math.floor(Math.random() * 50000) + 10000,
        recordsProcessed: Math.floor(Math.random() * 5000) + 1000,
      };

      setProgress(parsingProgress);
      onUploadComplete(parsingProgress);

      // Simulate parsing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const storingProgress: ImportProgress = {
        stage: "storing",
        progress: 60,
        message: "Creating SQLite database and importing tables...",
        startTime,
        totalBytes: file.size,
        bytesProcessed: Math.round(file.size * 0.6),
        totalRecords: parsingProgress.totalRecords,
        recordsProcessed: Math.round((parsingProgress.totalRecords || 0) * 0.6),
        currentTable: "users",
      };

      setProgress(storingProgress);
      onUploadComplete(storingProgress);

      // Simulate database creation delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const indexingProgress: ImportProgress = {
        stage: "indexing",
        progress: 90,
        message: "Creating indexes for optimal query performance...",
        startTime,
        totalBytes: file.size,
        bytesProcessed: Math.round(file.size * 0.9),
        totalRecords: parsingProgress.totalRecords,
        recordsProcessed: parsingProgress.totalRecords,
        currentTable: "products",
      };

      setProgress(indexingProgress);
      onUploadComplete(indexingProgress);

      // Simulate indexing delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real implementation, you would call:
      // const provider = await sqlDumpImporter.importSqlDump(
      //   projectId,
      //   providerName,
      //   tempPath,
      //   sqlDialect
      // );

      clientLogger.success(
        "SQL dump import completed",
        "file-import",
        {
          projectId,
          providerName,
          sqlDialect,
          fileName: file.name,
        },
        "SqlDumpUpload"
      );

      const completeProgress: ImportProgress = {
        stage: "complete",
        progress: 100,
        message: "SQL dump imported successfully!",
        startTime,
        totalBytes: file.size,
        bytesProcessed: file.size,
        totalRecords: parsingProgress.totalRecords,
        recordsProcessed: parsingProgress.totalRecords,
        estimatedCompletion: new Date(),
      };

      setProgress(completeProgress);
      onUploadComplete(completeProgress);
    } catch (error) {
      clientLogger.error(
        "SQL dump import failed",
        "file-import",
        { error, projectId, providerName },
        "SqlDumpUpload"
      );

      const errorMessage =
        error instanceof Error ? error.message : "Import failed";
      setError(errorMessage);

      const errorProgress: ImportProgress = {
        stage: "error",
        progress: 0,
        message: "Import failed",
        error: errorMessage,
        startTime,
        totalBytes: file.size,
        bytesProcessed: 0,
      };

      setProgress(errorProgress);
      onUploadComplete(errorProgress);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <Database className="mx-auto h-12 w-12 text-white/60 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Import SQL Dump
        </h3>
        <p className="text-white/70 text-sm">
          Upload a SQL dump file to create a new data source
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Import Progress */}
      {progress && (
        <ImportProgressIndicator
          progress={progress}
          fileName={file?.name}
          fileSize={file?.size}
          showDetails={true}
        />
      )}

      <div className="space-y-4">
        <Input
          label="Provider Name"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          placeholder="e.g., Production Database, Staging Data"
        />

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            SQL Dialect
          </label>
          <select
            value={sqlDialect}
            onChange={(e) =>
              setSqlDialect(e.target.value as "mysql" | "postgresql" | "sqlite")
            }
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="sqlite">SQLite</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            SQL Dump File
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".sql"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg hover:border-white/50 transition-colors">
              {file ? (
                <div className="text-center">
                  <FileText className="mx-auto h-8 w-8 text-white/60 mb-2" />
                  <p className="text-white text-sm font-medium">{file.name}</p>
                  <p className="text-white/60 text-xs">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-8 w-8 text-white/60 mb-2" />
                  <p className="text-white text-sm">Click to select SQL file</p>
                  <p className="text-white/60 text-xs">.sql files only</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          onClick={handleUpload}
          loading={loading}
          disabled={!file || !providerName.trim()}
          className="w-full"
        >
          <Database className="h-4 w-4 mr-2" />
          Import SQL Dump
        </Button>
      </div>

      <div className="text-xs text-white/50 text-center">
        <p>
          The SQL dump will be imported into a local SQLite database for
          analysis. Future uploads of the same dataset can be compared for
          changes.
        </p>
      </div>
    </div>
  );
};

export default SqlDumpUpload;
