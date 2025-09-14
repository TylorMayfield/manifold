"use client";

import React, { useState, useRef, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import {
  Play,
  Download,
  Upload,
  Save,
  Trash2,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { logger } from "../../lib/utils/logger";
import { DataSource, QueryResult } from "../../types";
import { SqlExecutor } from "../../lib/services/SqlExecutor";
import { SnapshotUtils } from "../../lib/utils/snapshotUtils";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import UndoRedoToolbar from "../ui/UndoRedoToolbar";
import { useTextUndoRedo } from "../../hooks/useUndoRedo";

interface SqlEditorProps {
  isOpen: boolean;
  onClose: () => void;
  dataSources: DataSource[];
  projectId: string;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
  result?: QueryResult;
  error?: string;
}

export default function SqlEditor({
  isOpen,
  onClose,
  dataSources,
  projectId,
}: SqlEditorProps) {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<any[]>([]);

  // Undo/Redo functionality for SQL queries
  const queryUndoRedo = useTextUndoRedo("", {
    maxHistorySize: 100,
    debounceMs: 300,
    autoSave: false,
  });

  const query = queryUndoRedo.value;
  const editorRef = useRef<any>(null);
  const sqlExecutor = SqlExecutor.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadAvailableTables();
    }
  }, [isOpen, projectId]);

  const loadAvailableTables = async () => {
    try {
      console.log(
        "SqlEditor: Loading available tables for project:",
        projectId
      );
      console.log("SqlEditor: Data sources available:", dataSources.length);

      const tables = await sqlExecutor.getAvailableTables(projectId);
      console.log("SqlEditor: Tables retrieved:", tables);

      setAvailableTables(tables);
      logger.info(
        "Available tables loaded",
        "data-processing",
        { tableCount: tables.length },
        "SqlEditor"
      );
    } catch (error) {
      console.error("SqlEditor: Failed to load available tables:", error);
      logger.error(
        "Failed to load available tables",
        "data-processing",
        { error },
        "SqlEditor"
      );
    }
  };

  const createMissingSnapshots = async () => {
    try {
      console.log("SqlEditor: Creating missing snapshots for data sources");

      const { DatabaseService } = await import(
        "../../lib/services/DatabaseService"
      );
      const dbService = DatabaseService.getInstance();

      // Get existing snapshots
      const existingSnapshots = await dbService.getSnapshots(projectId);
      console.log("Existing snapshots:", existingSnapshots.length);

      // Create snapshots for data sources that don't have them
      for (const dataSource of dataSources) {
        const hasSnapshot = existingSnapshots.some(
          (snapshot) => snapshot.dataSourceId === dataSource.id
        );

        if (!hasSnapshot) {
          console.log(`Creating snapshot for data source: ${dataSource.name}`);
          try {
            await SnapshotUtils.createSnapshotFromMockData(
              dataSource,
              projectId
            );
            console.log(`Snapshot created for: ${dataSource.name}`);
          } catch (error) {
            console.error(
              `Failed to create snapshot for ${dataSource.name}:`,
              error
            );
          }
        }
      }

      // Reload available tables
      await loadAvailableTables();

      logger.success(
        "Missing snapshots created",
        "data-processing",
        { projectId },
        "SqlEditor"
      );
    } catch (error) {
      console.error("SqlEditor: Failed to create missing snapshots:", error);
      logger.error(
        "Failed to create missing snapshots",
        "data-processing",
        { error },
        "SqlEditor"
      );
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Set up keyboard shortcuts with proper null checks
    if (editor && monaco && monaco.KeyMod && monaco.KeyCode) {
      try {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          executeQuery();
        });
      } catch (error) {
        console.warn("Failed to add keyboard shortcut:", error);
        // Fallback: add a simple action without keyboard shortcut
        try {
          editor.addAction({
            id: "execute-query",
            label: "Execute Query",
            run: () => {
              executeQuery();
            },
          });
        } catch (actionError) {
          console.warn("Failed to add editor action:", actionError);
          // Final fallback: just store the editor reference
        }
      }
    } else {
      console.warn(
        "Monaco Editor API not fully available, skipping keyboard shortcuts"
      );
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      setError("Please enter a SQL query");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("SqlEditor: Executing query:", query.trim());
      console.log("SqlEditor: Project ID:", projectId);
      console.log(
        "SqlEditor: Data sources:",
        dataSources.map((ds) => ({
          id: ds.id,
          name: ds.name,
          type: ds.type,
        }))
      );

      logger.info(
        "Executing SQL query",
        "data-processing",
        { query: query.trim(), projectId },
        "SqlEditor"
      );

      // Execute the query using the real SQL executor
      const result = await sqlExecutor.executeQuery(query.trim(), {
        projectId,
        dataSources,
      });

      console.log("SqlEditor: Query result received:", {
        rowCount: result.rowCount,
        columns: result.columns,
        executionTime: result.executionTime,
      });

      setResult(result);

      // Add to history
      const historyItem: QueryHistory = {
        id: `query_${Date.now()}`,
        query: query.trim(),
        timestamp: new Date(),
        result: result,
      };
      setQueryHistory((prev) => [historyItem, ...prev.slice(0, 19)]); // Keep last 20

      logger.success(
        "SQL query executed successfully",
        "data-processing",
        {
          rowCount: result.rowCount,
          executionTime: result.executionTime,
        },
        "SqlEditor"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Query execution failed";
      setError(errorMessage);

      // Add error to history
      const historyItem: QueryHistory = {
        id: `query_${Date.now()}`,
        query: query.trim(),
        timestamp: new Date(),
        error: errorMessage,
      };
      setQueryHistory((prev) => [historyItem, ...prev.slice(0, 19)]);

      logger.error(
        "SQL query execution failed",
        "data-processing",
        { error: errorMessage, query: query.trim() },
        "SqlEditor"
      );
    } finally {
      setLoading(false);
    }
  };

  const clearQuery = () => {
    queryUndoRedo.setValue("");
    setResult(null);
    setError(null);
    if (editorRef.current) {
      editorRef.current.setValue("");
    }
  };

  const loadQueryFromHistory = (historyItem: QueryHistory) => {
    queryUndoRedo.setValue(historyItem.query, false); // Don't add to history when loading from history
    setSelectedHistory(historyItem.id);
    if (editorRef.current) {
      editorRef.current.setValue(historyItem.query);
    }
  };

  const exportResults = async () => {
    if (!result) return;

    try {
      // Create CSV content
      const csvContent = [
        result.columns.join(","),
        ...result.rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `query_results_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.success(
        "Query results exported",
        "data-processing",
        {},
        "SqlEditor"
      );
    } catch (err) {
      logger.error(
        "Failed to export results",
        "data-processing",
        { error: err },
        "SqlEditor"
      );
    }
  };

  const getTablePreview = () => {
    return availableTables.map((table) => ({
      name: table.name,
      type: table.type,
      columns: table.columns,
      recordCount: table.recordCount,
    }));
  };

  const insertTableName = (tableName: string) => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const position = editor.getPosition();
      editor.executeEdits("insert-table-name", [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text: tableName,
          forceMoveMarkers: true,
        },
      ]);
      editor.focus();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SQL Editor" size="xl">
      <div className="flex h-[600px] gap-4">
        {/* Left Panel - Query Editor */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Query Editor</h3>
            <div className="flex items-center space-x-2">
              <UndoRedoToolbar
                undoRedo={queryUndoRedo}
                size="sm"
                variant="compact"
                showHistoryCount={true}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={clearQuery}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button
                size="sm"
                onClick={executeQuery}
                loading={loading}
                disabled={!query.trim()}
              >
                <Play className="h-4 w-4 mr-1" />
                Execute
              </Button>
            </div>
          </div>

          <div className="flex-1 border border-white/20 rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="sql"
              value={query}
              onChange={(value) => queryUndoRedo.setValue(value || "")}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                suggest: {
                  showKeywords: true,
                  showSnippets: true,
                },
              }}
            />
          </div>

          {/* Available Tables Info */}
          <div className="mt-3 p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white/70 text-sm font-medium">
                Available Tables
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={createMissingSnapshots}
                disabled={loading}
              >
                <Database className="h-3 w-3 mr-1" />
                Create Snapshots
              </Button>
            </div>
            <div className="space-y-2">
              {getTablePreview().length > 0 ? (
                getTablePreview().map((table, index) => (
                  <div
                    key={index}
                    className="p-2 bg-white/5 rounded border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => insertTableName(table.name)}
                        className="text-blue-400 hover:text-blue-300 font-medium text-sm cursor-pointer transition-colors"
                        title="Click to insert table name"
                      >
                        {table.name}
                      </button>
                      <span className="text-white/40 text-xs">
                        ({table.type})
                      </span>
                    </div>
                    <div className="text-xs text-white/60 mb-1">
                      {table.recordCount.toLocaleString()} records •{" "}
                      {table.columns.length} columns
                    </div>
                    <div className="text-xs text-white/50">
                      Columns: {table.columns.slice(0, 3).join(", ")}
                      {table.columns.length > 3 &&
                        ` +${table.columns.length - 3} more`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-white/50 text-center py-2">
                  No tables available. Import data first.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Results & History */}
        <div className="w-80 flex flex-col">
          {/* Results */}
          <div className="flex-1 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Results</h3>
              {result && (
                <Button size="sm" variant="outline" onClick={exportResults}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              )}
            </div>

            <div className="flex-1 border border-white/20 rounded-lg p-4 overflow-auto">
              {loading && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                </div>
              )}

              {error && (
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">
                      {result.rowCount} rows in {result.executionTime}ms
                    </span>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/20">
                          {result.columns.map((col, index) => (
                            <th
                              key={index}
                              className="text-left py-2 px-2 text-white/70"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.slice(0, 50).map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="border-b border-white/10"
                          >
                            {row.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="py-2 px-2 text-white/60"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.rows.length > 50 && (
                      <p className="text-xs text-white/50 mt-2">
                        Showing first 50 of {result.rows.length} rows
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!result && !error && !loading && (
                <div className="flex items-center justify-center h-full text-white/50">
                  <div className="text-center">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No query results yet</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Query History */}
          <div className="h-48">
            <h3 className="text-white font-medium mb-3">Query History</h3>
            <div className="border border-white/20 rounded-lg p-3 overflow-auto">
              {queryHistory.length === 0 ? (
                <p className="text-white/50 text-sm">No queries executed yet</p>
              ) : (
                <div className="space-y-2">
                  {queryHistory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedHistory === item.id
                          ? "bg-blue-500/20 border border-blue-500/30"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={() => loadQueryFromHistory(item)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60">
                          {item.timestamp.toLocaleTimeString()}
                        </span>
                        {item.error ? (
                          <AlertCircle className="h-3 w-3 text-red-400" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-green-400" />
                        )}
                      </div>
                      <p className="text-xs text-white/80 truncate">
                        {item.query.substring(0, 50)}
                        {item.query.length > 50 && "..."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
