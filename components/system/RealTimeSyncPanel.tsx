"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Play,
  Pause,
  Plus,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Trash2,
  Edit,
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import { clientLogger } from "../../lib/utils/ClientLogger";
import { clientDatabaseService } from "../../lib/database/ClientDatabaseService";
import {
  RealTimeSyncManager,
  DataSource as SyncDataSource,
  SyncConfig,
} from "../../lib/server/services/RealTimeSyncManager";
import { DataSource } from "../../types";

interface SyncStatus {
  source: string;
  status: "connected" | "disconnected" | "syncing" | "error";
  lastSync?: number;
  error?: string;
  recordCount?: number;
}

interface RealTimeSyncPanelProps {
  projectId: string;
  onDataUpdate?: (update: any) => void;
}

export const RealTimeSyncPanel: React.FC<RealTimeSyncPanelProps> = ({
  projectId,
  onDataUpdate,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [syncStatuses, setSyncStatuses] = useState<Map<string, SyncStatus>>(
    new Map()
  );
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncManager, setSyncManager] = useState<RealTimeSyncManager | null>(
    null
  );

  // Form state for adding new sources
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceType, setNewSourceType] = useState<
    "api_script" | "mysql" | "csv" | "postgres"
  >("api_script");
  const [newSourceConfig, setNewSourceConfig] = useState<any>({});
  const [newSourceInterval, setNewSourceInterval] = useState<number>(30);

  // Settings state
  const [globalSyncInterval, setGlobalSyncInterval] = useState<number>(60);
  const [conflictResolution, setConflictResolution] = useState<
    "last_write_wins" | "manual" | "merge"
  >("last_write_wins");
  const [maxRetries, setMaxRetries] = useState<number>(3);

  const dbService = clientDatabaseService;

  // Load data sources from the database
  useEffect(() => {
    const loadDataSources = async () => {
      try {
        setLoading(true);
        const sources = await dbService.getDataSources(projectId);
        setDataSources(sources);
        clientLogger.info(
          "Data sources loaded for real-time sync",
          "realtime-sync",
          {
            projectId,
            sourceCount: sources.length,
          }
        );
      } catch (error) {
        clientLogger.error("Failed to load data sources", "realtime-sync", {
          projectId,
          error: (error as Error).message,
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadDataSources();
    }
  }, [projectId]);

  // Initialize sync manager when data sources are loaded
  useEffect(() => {
    if (dataSources.length > 0 && !syncManager) {
      const syncConfig: SyncConfig = {
        sources: dataSources.map((ds) => ({
          id: ds.id,
          name: ds.name,
          type: ds.type as "api" | "database" | "file" | "websocket",
          config: ds.config,
          syncInterval: (ds as any).syncInterval || globalSyncInterval * 1000,
          enabled: true, // Start with all sources enabled
        })),
        globalSyncInterval: globalSyncInterval * 1000,
        conflictResolution,
        maxRetries,
      };

      const manager = new RealTimeSyncManager(syncConfig);

      // Set up event handlers
      manager.on("connected", () => {
        setIsConnected(true);
        clientLogger.info("Real-time sync connected", "realtime-sync");
      });

      manager.on("disconnected", () => {
        setIsConnected(false);
        clientLogger.warn("Real-time sync disconnected", "realtime-sync");
      });

      manager.on("dataUpdate", (update) => {
        clientLogger.info("Data update received", "realtime-sync", {
          updateId: update.id,
          source: update.source,
          type: update.type,
        });
        onDataUpdate?.(update);
      });

      manager.on("syncStatus", (status) => {
        setSyncStatuses((prev) => {
          const newStatuses = new Map(prev);
          newStatuses.set(status.source, status);
          return newStatuses;
        });
      });

      manager.on("error", (error) => {
        clientLogger.error("Real-time sync error", "realtime-sync", {
          error: (error as Error).message,
        });
      });

      setSyncManager(manager);
    }
  }, [
    dataSources,
    globalSyncInterval,
    conflictResolution,
    maxRetries,
    onDataUpdate,
  ]);

  // Cleanup sync manager on unmount
  useEffect(() => {
    return () => {
      if (syncManager) {
        syncManager.stop();
      }
    };
  }, [syncManager]);

  const handleStartStop = async () => {
    if (!syncManager) return;

    try {
      if (isRunning) {
        syncManager.stop();
        setIsRunning(false);
        clientLogger.info("Real-time sync stopped", "realtime-sync");
      } else {
        await syncManager.start();
        setIsRunning(true);
        clientLogger.info("Real-time sync started", "realtime-sync");
      }
    } catch (error) {
      clientLogger.error(
        "Failed to start/stop real-time sync",
        "realtime-sync",
        {
          error: (error as Error).message,
        }
      );
    }
  };

  const handleForceSync = (sourceId: string) => {
    if (!syncManager) return;

    try {
      syncManager.forceSync(sourceId);
      clientLogger.info("Force sync requested", "realtime-sync", { sourceId });
    } catch (error) {
      clientLogger.error("Failed to force sync", "realtime-sync", {
        sourceId,
        error: (error as Error).message,
      });
    }
  };

  const handleToggleSource = async (sourceId: string) => {
    if (!syncManager) return;

    try {
      const source = dataSources.find((ds) => ds.id === sourceId);
      if (!source) return;

      const newEnabled = !source.enabled;
      await dbService.updateDataSource("default", sourceId, {
        enabled: newEnabled,
      });

      syncManager.updateDataSource(sourceId, { enabled: newEnabled });

      setDataSources((prev) =>
        prev.map((ds) =>
          ds.id === sourceId ? { ...ds, enabled: newEnabled } : ds
        )
      );

      clientLogger.info("Data source toggled", "realtime-sync", {
        sourceId,
        enabled: newEnabled,
      });
    } catch (error) {
      clientLogger.error("Failed to toggle data source", "realtime-sync", {
        sourceId,
        error: (error as Error).message,
      });
    }
  };

  const handleAddSource = async () => {
    if (!newSourceName.trim()) return;

    try {
      const newSource: DataSource = {
        id: `source-${Date.now()}`,
        name: newSourceName,
        type: newSourceType,
        config: newSourceConfig,
        projectId,
        syncInterval: newSourceInterval * 1000,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dbService.createDataSource(projectId, newSource);

      if (syncManager) {
        const syncDataSource: SyncDataSource = {
          id: newSource.id,
          name: newSource.name,
          type:
            newSourceType === "api_script"
              ? "api"
              : newSourceType === "mysql" || newSourceType === "postgres"
              ? "database"
              : newSourceType === "csv"
              ? "file"
              : "api",
          config: newSourceConfig,
          syncInterval: newSourceInterval * 1000,
          enabled: true,
        };
        syncManager.addDataSource(syncDataSource);
      }

      setDataSources((prev) => [...prev, newSource]);
      setShowAddSource(false);

      // Reset form
      setNewSourceName("");
      setNewSourceType("api_script");
      setNewSourceConfig({});
      setNewSourceInterval(30);

      clientLogger.info("Data source added", "realtime-sync", {
        sourceId: newSource.id,
        sourceName: newSource.name,
      });
    } catch (error) {
      clientLogger.error("Failed to add data source", "realtime-sync", {
        error: (error as Error).message,
      });
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!syncManager) return;

    try {
      await dbService.deleteDataSource(sourceId, projectId);
      syncManager.removeDataSource(sourceId);
      setDataSources((prev) => prev.filter((ds) => ds.id !== sourceId));

      clientLogger.info("Data source deleted", "realtime-sync", { sourceId });
    } catch (error) {
      clientLogger.error("Failed to delete data source", "realtime-sync", {
        sourceId,
        error: (error as Error).message,
      });
    }
  };

  const getStatusIcon = (status: SyncStatus["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: SyncStatus["status"]) => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "syncing":
        return "text-blue-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return "Never";

    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-400">Loading data sources...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-500" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-500" />
          )}
          <h3 className="text-lg font-semibold">Real-Time Sync</h3>
          <span
            className={`text-sm px-2 py-1 rounded-full ${
              isConnected
                ? "bg-green-500/20 text-green-500"
                : "bg-red-500/20 text-red-500"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddSource(true)}
          >
            <Plus className="w-4 h-4" />
            Add Source
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={handleStartStop}
            disabled={!syncManager || dataSources.length === 0}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {dataSources.map((source) => {
          const status = syncStatuses.get(source.id);
          return (
            <div
              key={source.id}
              className="glass-card p-4 border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{source.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          source.enabled
                            ? "bg-green-500/20 text-green-500"
                            : "bg-gray-500/20 text-gray-500"
                        }`}
                      >
                        {source.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 capitalize">
                      {source.type} •{" "}
                      {source.syncInterval
                        ? `${source.syncInterval / 1000}s interval`
                        : "Manual"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleForceSync(source.id)}
                    disabled={!source.enabled}
                    title="Force sync"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSource(source.id)}
                    title={source.enabled ? "Disable source" : "Enable source"}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSource(source.id)}
                    title="Delete source"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {status && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.status)}
                      <span className={getStatusColor(status.status)}>
                        {status.status.charAt(0).toUpperCase() +
                          status.status.slice(1)}
                      </span>
                    </div>

                    <div className="text-gray-400">
                      Last sync: {formatLastSync(status.lastSync)}
                    </div>

                    {status.recordCount !== undefined && (
                      <div className="text-gray-400">
                        Records: {status.recordCount}
                      </div>
                    )}
                  </div>

                  {status.error && (
                    <div className="text-red-500 text-xs">{status.error}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dataSources.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No data sources configured</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowAddSource(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Source
          </Button>
        </div>
      )}

      {/* Add Source Modal */}
      <Modal
        isOpen={showAddSource}
        onClose={() => setShowAddSource(false)}
        title="Add Data Source"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              placeholder="Enter source name"
              value={newSourceName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewSourceName(e.target.value)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
              value={newSourceType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setNewSourceType(
                  e.target.value as "api_script" | "mysql" | "csv" | "postgres"
                )
              }
            >
              <option value="api_script">API Script</option>
              <option value="mysql">MySQL Database</option>
              <option value="csv">CSV File</option>
              <option value="postgres">PostgreSQL</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Sync Interval (seconds)
            </label>
            <Input
              type="number"
              placeholder="30"
              value={newSourceInterval}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewSourceInterval(parseInt(e.target.value) || 30)
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddSource(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSource} disabled={!newSourceName.trim()}>
              Add Source
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Sync Settings"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Global Sync Interval (seconds)
            </label>
            <Input
              type="number"
              placeholder="60"
              value={globalSyncInterval}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setGlobalSyncInterval(parseInt(e.target.value) || 60)
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Conflict Resolution
            </label>
            <select
              className="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white"
              value={conflictResolution}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setConflictResolution(
                  e.target.value as "last_write_wins" | "manual" | "merge"
                )
              }
            >
              <option value="last_write_wins">Last Write Wins</option>
              <option value="manual">Manual Resolution</option>
              <option value="merge">Merge Changes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Retry Attempts
            </label>
            <Input
              type="number"
              placeholder="3"
              value={maxRetries}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMaxRetries(parseInt(e.target.value) || 3)
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Settings are automatically applied when they change
                setShowSettings(false);
                clientLogger.info("Sync settings updated", "realtime-sync", {
                  globalSyncInterval,
                  conflictResolution,
                  maxRetries,
                });
              }}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
