"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
  HardDrive,
} from "lucide-react";
import { logger } from "../../lib/utils/logger";
import { DatabaseService } from "../../lib/services/DatabaseService";
import { DataSource, Snapshot } from "../../types";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface SnapshotViewerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  dataSources: DataSource[];
}

interface SnapshotInfo {
  snapshot: Snapshot;
  dataSource: DataSource;
  size: number;
  location: string;
}

export default function SnapshotViewer({
  isOpen,
  onClose,
  projectId,
  dataSources,
}: SnapshotViewerProps) {
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotInfo | null>(
    null
  );
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{
    totalSnapshots: number;
    totalSize: number;
    storageLocation: string;
    isElectron: boolean;
  } | null>(null);

  const dbService = DatabaseService.getInstance();

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen, projectId]);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      console.log("SnapshotViewer: Loading snapshots for project:", projectId);

      // Get all snapshots
      const allSnapshots = await dbService.getSnapshots(projectId);
      console.log("SnapshotViewer: Raw snapshots:", allSnapshots);

      // Get storage info
      const isElectron = !!(window as any).electronAPI;
      const storageLocation = isElectron
        ? "SQLite Database (Electron)"
        : "localStorage (Browser)";

      // Calculate total size
      const totalSize = allSnapshots.reduce((sum, snapshot) => {
        const dataSize = snapshot.data
          ? JSON.stringify(snapshot.data).length
          : 0;
        return sum + dataSize;
      }, 0);

      setStorageInfo({
        totalSnapshots: allSnapshots.length,
        totalSize,
        storageLocation,
        isElectron,
      });

      // Combine snapshots with data source info
      const snapshotInfos: SnapshotInfo[] = allSnapshots.map((snapshot) => {
        const dataSource = dataSources.find(
          (ds) => ds.id === snapshot.dataSourceId
        );
        const dataSize = snapshot.data
          ? JSON.stringify(snapshot.data).length
          : 0;

        return {
          snapshot,
          dataSource: dataSource || {
            id: snapshot.dataSourceId,
            name: "Unknown Data Source",
            type: "file",
            projectId,
            config: {},
            status: "idle",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          size: dataSize,
          location: isElectron
            ? `SQLite: ${projectId}.db`
            : `localStorage: manifold_snapshots_${projectId}`,
        };
      });

      // Sort by creation date (newest first)
      snapshotInfos.sort(
        (a, b) =>
          new Date(b.snapshot.createdAt).getTime() -
          new Date(a.snapshot.createdAt).getTime()
      );

      setSnapshots(snapshotInfos);

      logger.info(
        "Snapshots loaded successfully",
        "data-processing",
        {
          projectId,
          snapshotCount: allSnapshots.length,
          totalSize,
          storageLocation,
        },
        "SnapshotViewer"
      );
    } catch (error) {
      console.error("SnapshotViewer: Failed to load snapshots:", error);
      logger.error(
        "Failed to load snapshots",
        "data-processing",
        { error, projectId },
        "SnapshotViewer"
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteSnapshot = async (snapshotId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this snapshot? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await dbService.deleteSnapshot(snapshotId, projectId);
      await loadSnapshots(); // Reload the list

      logger.success(
        "Snapshot deleted successfully",
        "data-processing",
        { snapshotId, projectId },
        "SnapshotViewer"
      );
    } catch (error) {
      console.error("Failed to delete snapshot:", error);
      logger.error(
        "Failed to delete snapshot",
        "data-processing",
        { error, snapshotId },
        "SnapshotViewer"
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const exportSnapshot = (snapshotInfo: SnapshotInfo) => {
    const dataStr = JSON.stringify(snapshotInfo.snapshot.data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `snapshot_${snapshotInfo.snapshot.id}_${snapshotInfo.dataSource.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Snapshot Storage Viewer"
        size="xl"
      >
        <div className="space-y-6">
          {/* Storage Info */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium flex items-center">
                <HardDrive className="h-5 w-5 mr-2 text-blue-400" />
                Storage Information
              </h3>
              <Button
                onClick={loadSnapshots}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {storageInfo && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Database className="h-4 w-4 text-blue-400" />
                    <span className="text-white/70 text-sm">
                      Total Snapshots
                    </span>
                  </div>
                  <p className="text-white font-semibold text-lg">
                    {storageInfo.totalSnapshots}
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="h-4 w-4 text-green-400" />
                    <span className="text-white/70 text-sm">Total Size</span>
                  </div>
                  <p className="text-white font-semibold text-lg">
                    {formatFileSize(storageInfo.totalSize)}
                  </p>
                </div>

                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <HardDrive className="h-4 w-4 text-purple-400" />
                    <span className="text-white/70 text-sm">
                      Storage Location
                    </span>
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {storageInfo.storageLocation}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Snapshots List */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-white font-medium mb-4 flex items-center">
              <Eye className="h-5 w-5 mr-2 text-green-400" />
              Snapshots ({snapshots.length})
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-white/60">Loading snapshots...</p>
                </div>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <p className="text-white/60 mb-2">No snapshots found</p>
                <p className="text-white/40 text-sm">
                  Snapshots are created when you import data or use the SQL
                  editor
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {snapshots.map((snapshotInfo) => (
                  <div
                    key={snapshotInfo.snapshot.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Database className="h-5 w-5 text-blue-400" />
                        <div>
                          <h4 className="text-white font-medium">
                            {snapshotInfo.dataSource.name}
                          </h4>
                          <p className="text-white/60 text-sm">
                            {formatDate(snapshotInfo.snapshot.createdAt)} •{" "}
                            {formatFileSize(snapshotInfo.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                          {snapshotInfo.snapshot.recordCount || 0} records
                        </span>
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                          {snapshotInfo.dataSource.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/50">
                        <p>
                          <strong>ID:</strong> {snapshotInfo.snapshot.id}
                        </p>
                        <p>
                          <strong>Location:</strong> {snapshotInfo.location}
                        </p>
                        <p>
                          <strong>Data Source ID:</strong>{" "}
                          {snapshotInfo.dataSource.id}
                        </p>
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            setSelectedSnapshot(snapshotInfo);
                            setShowSnapshotModal(true);
                          }}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Data
                        </Button>
                        <Button
                          onClick={() => exportSnapshot(snapshotInfo)}
                          size="sm"
                          variant="outline"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                        <Button
                          onClick={() =>
                            deleteSnapshot(snapshotInfo.snapshot.id)
                          }
                          size="sm"
                          variant="outline"
                          className="text-red-400 hover:text-red-300 hover:border-red-400"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage Details */}
          <div className="glass-card rounded-xl p-4">
            <h3 className="text-white font-medium mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-400" />
              Storage Details
            </h3>
            <div className="text-sm text-white/70 space-y-2">
              <p>
                <strong>Electron Mode:</strong> Snapshots are stored in SQLite
                database files located in your system's app data directory.
              </p>
              <p>
                <strong>Browser Mode:</strong> Snapshots are stored in
                localStorage with keys like{" "}
                <code className="bg-white/10 px-1 rounded">
                  manifold_snapshots_[projectId]
                </code>
                .
              </p>
              <p>
                <strong>Data Format:</strong> All snapshot data is stored as
                JSON strings, with metadata including creation timestamps and
                record counts.
              </p>
              <p>
                <strong>Performance:</strong> Large snapshots may impact browser
                performance in localStorage mode. Consider using Electron for
                production use.
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Snapshot Data Modal */}
      <Modal
        isOpen={showSnapshotModal}
        onClose={() => setShowSnapshotModal(false)}
        title={`Snapshot Data: ${selectedSnapshot?.dataSource.name}`}
        size="xl"
      >
        {selectedSnapshot && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-white/60">
                {selectedSnapshot.snapshot.recordCount || 0} records •{" "}
                {formatFileSize(selectedSnapshot.size)}
              </div>
              <Button
                onClick={() => exportSnapshot(selectedSnapshot)}
                size="sm"
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export JSON
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <pre className="bg-gray-900 p-4 rounded-lg text-xs text-white/80 overflow-x-auto">
                {JSON.stringify(selectedSnapshot.snapshot.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
