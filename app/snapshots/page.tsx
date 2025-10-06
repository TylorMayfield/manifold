"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDataSources } from "../../contexts/DataSourceContext";
import PageLayout from "../../components/layout/PageLayout";
import CellButton from "../../components/ui/CellButton";
import CellCard from "../../components/ui/CellCard";
import CellModal from "../../components/ui/CellModal";
import CellInput from "../../components/ui/CellInput";
import SnapshotDiffViewer from "../../components/data/SnapshotDiffViewer";
import {
  FileText,
  Plus,
  Download,
  Settings,
  Trash2,
  Clock,
  Database,
  GitBranch,
  Search,
  Filter,
  Eye,
  BarChart3,
  Calendar,
  ArrowRight,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

interface SnapshotWithSource {
  id: string;
  dataSourceId: string;
  dataSourceName: string;
  version: number;
  recordCount: number;
  size: string;
  createdAt: Date;
  metadata?: {
    columns: number;
    fileType?: string;
    compression?: string;
    checksum?: string;
  };
}

export default function SnapshotsPage() {
  const router = useRouter();
  const { dataSources, snapshots } = useDataSources();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<SnapshotWithSource | null>(null);

  // Use only actual snapshots from context
  const allSnapshots = snapshots.map((snap) => {
    const source = dataSources.find((ds) => ds.id === snap.dataSourceId);
    return {
      id: snap.id,
      dataSourceId: snap.dataSourceId,
      dataSourceName: source?.name || "Unknown Source",
      version: snap.version || 1,
      recordCount: snap.recordCount || 0,
      size: `${Math.round((snap.recordCount || 0) * 0.15)} KB`,
      createdAt: snap.createdAt,
      metadata: {
        columns: snap.schema?.columns.length || 0,
        fileType: "Generated",
      },
    };
  });

  const filteredSnapshots = allSnapshots
    .filter(
      (snapshot) =>
        searchTerm === "" ||
        snapshot.dataSourceName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        snapshot.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(
      (snapshot) =>
        filterSource === "all" || snapshot.dataSourceId === filterSource
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const uniqueSources = Array.from(
    new Set(allSnapshots.map((s) => s.dataSourceId))
  ).map((id) => {
    const snapshot = allSnapshots.find((s) => s.dataSourceId === id);
    return { id, name: snapshot?.dataSourceName || "Unknown" };
  });

  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleSnapshotSelect = (snapshotId: string) => {
    setSelectedSnapshots((prev) =>
      prev.includes(snapshotId)
        ? prev.filter((id) => id !== snapshotId)
        : [...prev, snapshotId]
    );
  };

  const handleCompareSnapshots = async () => {
    if (selectedSnapshots.length !== 2) return;

    try {
      setIsComparing(true);
      
      const response = await fetch('/api/snapshots/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSnapshotId: selectedSnapshots[0],
          toSnapshotId: selectedSnapshots[1],
          comparisonKey: 'id',
          options: {
            includeUnchanged: false,
            trimStrings: true,
            caseSensitive: false,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComparisonResult(data.comparison);
        setShowCompareModal(true);
      } else {
        const error = await response.json();
        alert(`Comparison failed: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Comparison error:', error);
      alert('Failed to compare snapshots');
    } finally {
      setIsComparing(false);
    }
  };

  const getTotalSize = () => {
    return allSnapshots.reduce((total, snapshot) => {
      const sizeNum = parseFloat(snapshot.size);
      const unit = snapshot.size.split(" ")[1];
      if (unit === "MB") return total + sizeNum;
      if (unit === "KB") return total + sizeNum / 1024;
      return total;
    }, 0);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <PageLayout
      title="Data Snapshots"
      subtitle="Version history and data backups"
      icon={FileText}
      showNavigation={true}
      showBackButton={true}
      backButtonText="Back to Home"
      backButtonHref="/"
      headerActions={
        <div className="flex items-center space-x-2">
          {selectedSnapshots.length === 2 && (
            <CellButton 
              variant="primary" 
              onClick={handleCompareSnapshots}
              disabled={isComparing}
              isLoading={isComparing}
            >
              <GitBranch className="w-4 h-4 mr-2" />
              {isComparing ? 'Comparing...' : 'Compare Selected'}
            </CellButton>
          )}
          <CellButton variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </CellButton>
          <CellButton variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </CellButton>
        </div>
      }
    >

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold">Total Snapshots</p>
              <p className="text-heading font-mono">{allSnapshots.length}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </CellCard>
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold">Data Sources</p>
              <p className="text-heading font-mono">{uniqueSources.length}</p>
            </div>
            <Database className="w-8 h-8 text-blue-400" />
          </div>
        </CellCard>
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold">Total Records</p>
              <p className="text-heading font-mono">
                {allSnapshots
                  .reduce((sum, s) => sum + s.recordCount, 0)
                  .toLocaleString()}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-400" />
          </div>
        </CellCard>
        <CellCard className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption font-bold">Storage Used</p>
              <p className="text-heading font-mono">
                {getTotalSize().toFixed(1)} MB
              </p>
            </div>
            <Database className="w-8 h-8 text-purple-400" />
          </div>
        </CellCard>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <CellCard className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <CellInput
                placeholder="Search snapshots or data sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="px-3 py-2 border-2 border-black bg-white font-mono text-sm"
              >
                <option value="all">All Sources</option>
                {uniqueSources.map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CellCard>

        {selectedSnapshots.length > 0 && (
          <CellCard className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold">
                  {selectedSnapshots.length} snapshot
                  {selectedSnapshots.length !== 1 ? "s" : ""} selected
                </span>
              </div>
              <div className="flex space-x-2">
                {selectedSnapshots.length === 2 && (
                  <CellButton
                    size="sm"
                    variant="accent"
                    onClick={handleCompareSnapshots}
                  >
                    <GitBranch className="w-4 h-4 mr-1" />
                    Compare
                  </CellButton>
                )}
                <CellButton size="sm" variant="ghost">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </CellButton>
                <CellButton
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedSnapshots([])}
                >
                  Clear Selection
                </CellButton>
              </div>
            </div>
          </CellCard>
        )}
      </div>

      {/* Snapshots List */}
      {filteredSnapshots.length === 0 ? (
        <CellCard className="p-12">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-subheading mb-2">
              {searchTerm || filterSource !== "all"
                ? "No snapshots match your filters"
                : "No snapshots available"}
            </h2>
            <p className="text-caption text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || filterSource !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Snapshots are created automatically when you import data or manually trigger backups."}
            </p>
            {(searchTerm || filterSource !== "all") && (
              <CellButton
                variant="primary"
                onClick={() => {
                  setSearchTerm("");
                  setFilterSource("all");
                }}
              >
                Clear Filters
              </CellButton>
            )}
          </div>
        </CellCard>
      ) : (
        <div className="space-y-4">
          {filteredSnapshots.map((snapshot) => (
            <CellCard key={snapshot.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedSnapshots.includes(snapshot.id)}
                    onChange={() => handleSnapshotSelect(snapshot.id)}
                    className="w-4 h-4"
                  />
                  <div className="p-2 border-2 border-black bg-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-lg">
                      {snapshot.dataSourceName}
                    </h3>
                    <p className="text-caption text-gray-600">
                      Version {snapshot.version} • {snapshot.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 text-xs font-mono bg-blue-100 text-blue-800">
                    v{snapshot.version}
                  </span>
                  <div className="flex space-x-1">
                    <CellButton
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedSnapshot(snapshot);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </CellButton>
                    <CellButton size="sm" variant="ghost">
                      <Download className="w-4 h-4" />
                    </CellButton>
                    <CellButton size="sm" variant="ghost">
                      <Trash2 className="w-4 h-4" />
                    </CellButton>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div>
                  <h4 className="font-mono font-bold text-sm mb-2">Records</h4>
                  <div className="p-3 border border-gray-200 bg-gray-50">
                    <p className="text-lg font-mono font-bold">
                      {snapshot.recordCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">rows</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-sm mb-2">Size</h4>
                  <div className="p-3 border border-gray-200 bg-gray-50">
                    <p className="text-lg font-mono font-bold">
                      {snapshot.size}
                    </p>
                    <p className="text-xs text-gray-500">uncompressed</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-sm mb-2">Schema</h4>
                  <div className="p-3 border border-gray-200 bg-gray-50">
                    <p className="text-lg font-mono font-bold">
                      {snapshot.metadata?.columns || 0}
                    </p>
                    <p className="text-xs text-gray-500">columns</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-sm mb-2">Format</h4>
                  <div className="p-3 border border-gray-200 bg-gray-50">
                    <p className="text-sm font-mono font-bold">
                      {snapshot.metadata?.fileType || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">file type</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-mono font-bold text-sm mb-2">Created</h4>
                  <div className="p-3 border border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      <div>
                        <p className="text-sm font-mono">
                          {getTimeAgo(snapshot.createdAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {snapshot.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CellCard>
          ))}
        </div>
      )}

      {/* Compare Snapshots Modal */}
      <CellModal
        isOpen={showCompareModal}
        onClose={() => {
          setShowCompareModal(false);
          setComparisonResult(null);
        }}
        title="Compare Snapshots"
        size="xl"
      >
        {comparisonResult ? (
          <SnapshotDiffViewer
            comparison={comparisonResult}
            onClose={() => {
              setShowCompareModal(false);
              setComparisonResult(null);
            }}
          />
        ) : (
          <div className="space-y-6">
            {selectedSnapshots.length === 2 && (
            <>
              <div className="grid grid-cols-2 gap-6">
                {selectedSnapshots.map((snapshotId, index) => {
                  const snapshot = allSnapshots.find(
                    (s) => s.id === snapshotId
                  );
                  if (!snapshot) return null;

                  return (
                    <div key={snapshotId} className="space-y-4">
                      <h3 className="font-mono font-bold text-center">
                        Version {snapshot.version}{" "}
                        {index === 0 ? "(Older)" : "(Newer)"}
                      </h3>
                      <CellCard className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Records:</span>
                            <span className="font-mono">
                              {snapshot.recordCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Size:</span>
                            <span className="font-mono">{snapshot.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Columns:</span>
                            <span className="font-mono">
                              {snapshot.metadata?.columns}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-bold">Created:</span>
                            <span className="font-mono text-xs">
                              {snapshot.createdAt.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CellCard>
                    </div>
                  );
                })}
              </div>

              <div className="text-center">
                <ArrowRight className="w-8 h-8 mx-auto text-gray-400" />
              </div>

              <CellCard className="p-4 bg-blue-50 border-blue-200">
                <h4 className="font-mono font-bold mb-2">Comparison Summary</h4>
                <div className="space-y-2 text-sm">
                  {(() => {
                    const older = allSnapshots.find(
                      (s) => s.id === selectedSnapshots[0]
                    );
                    const newer = allSnapshots.find(
                      (s) => s.id === selectedSnapshots[1]
                    );
                    if (!older || !newer) return null;

                    const recordDiff = newer.recordCount - older.recordCount;
                    return (
                      <>
                        <p>
                          <strong>Records:</strong> {recordDiff > 0 ? "+" : ""}
                          {recordDiff.toLocaleString()}(
                          {recordDiff >= 0 ? "added" : "removed"})
                        </p>
                        <p>
                          <strong>Time difference:</strong>{" "}
                          {Math.floor(
                            (newer.createdAt.getTime() -
                              older.createdAt.getTime()) /
                              (1000 * 60 * 60)
                          )}{" "}
                          hours
                        </p>
                      </>
                    );
                  })()}
                </div>
              </CellCard>
            </>
          )}
          <div className="flex justify-end space-x-2">
            <CellButton
              variant="ghost"
              onClick={() => setShowCompareModal(false)}
            >
              Close
            </CellButton>
            <CellButton 
              variant="primary"
              onClick={handleCompareSnapshots}
              disabled={isComparing}
            >
              {isComparing ? 'Comparing...' : 'View Detailed Diff'}
            </CellButton>
          </div>
        </div>
        )}
      </CellModal>

      {/* Snapshot Details Modal */}
      <CellModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Snapshot Details"
        size="lg"
      >
        {selectedSnapshot && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono font-bold mb-1">
                  Snapshot ID
                </label>
                <div className="px-3 py-2 bg-gray-100 text-sm font-mono">
                  {selectedSnapshot.id}
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono font-bold mb-1">
                  Version
                </label>
                <div className="px-3 py-2 bg-gray-100 text-sm font-mono">
                  v{selectedSnapshot.version}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-mono font-bold mb-2">
                Metadata
              </label>
              <div className="p-4 bg-gray-50 border border-gray-200 font-mono text-sm">
                <pre>{JSON.stringify(selectedSnapshot.metadata, null, 2)}</pre>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono font-bold mb-1">
                  Created
                </label>
                <div className="px-3 py-2 bg-gray-100 text-sm font-mono">
                  {selectedSnapshot.createdAt.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-mono font-bold mb-1">
                  Checksum
                </label>
                <div className="px-3 py-2 bg-gray-100 text-sm font-mono">
                  {selectedSnapshot.metadata?.checksum || "N/A"}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <CellButton
                variant="ghost"
                onClick={() => setShowDetailsModal(false)}
              >
                Close
              </CellButton>
              <CellButton variant="accent">
                <Download className="w-4 h-4 mr-2" />
                Export Snapshot
              </CellButton>
            </div>
          </div>
        )}
      </CellModal>
    </PageLayout>
  );
}
