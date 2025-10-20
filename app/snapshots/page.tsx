"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDataSources } from "../../contexts/DataSourceContext";
import PageLayout from "../../components/layout/PageLayout";
import CellButton from "../../components/ui/CellButton";
import CellCard from "../../components/ui/CellCard";
import CellModal from "../../components/ui/CellModal";
import CellInput from "../../components/ui/CellInput";
import SnapshotDiffViewer from "../../components/data/SnapshotDiffViewer";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import LoadingOverlay, { FullScreenLoadingOverlay } from "../../components/ui/LoadingOverlay";
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
  const { dataSources, snapshots, loading } = useDataSources();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [selectedSnapshots, setSelectedSnapshots] = useState<string[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<SnapshotWithSource | null>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [keepCount, setKeepCount] = useState<number>(5);
  const [deletingSnapshot, setDeletingSnapshot] = useState<string | null>(null);

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
      createdAt: new Date(snap.createdAt as any),
      metadata: {
        columns: snap.schema?.columns.length || 0,
        fileType: "Generated",
      },
    };
  });

  const filteredSnapshots = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    let list = allSnapshots
      .filter((snapshot) =>
        lower === "" ||
        snapshot.dataSourceName.toLowerCase().includes(lower) ||
        snapshot.id.toLowerCase().includes(lower)
      )
      .filter((snapshot) => filterSource === "all" || snapshot.dataSourceId === filterSource);

    if (dateFrom) {
      const from = new Date(dateFrom);
      list = list.filter((s) => s.createdAt >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      // include end-of-day
      to.setHours(23, 59, 59, 999);
      list = list.filter((s) => s.createdAt <= to);
    }

    return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [allSnapshots, searchTerm, filterSource, dateFrom, dateTo]);

  const handleDeleteSnapshot = async (snapshotId: string, snapshotName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this snapshot?\n\n${snapshotName}\nID: ${snapshotId}\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeletingSnapshot(snapshotId);

    try {
      const response = await fetch(`/api/snapshots/${snapshotId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete snapshot');
      }

      alert(`✅ Snapshot deleted successfully!`);
      
      // Reload page to refresh snapshot list
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      alert(`❌ Failed to delete snapshot\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDeletingSnapshot(null);
    }
  };

  const handleDownloadSnapshot = async (snapshot: SnapshotWithSource) => {
    try {
      // Fetch the snapshot data
      const response = await fetch(`/api/data-sources/${snapshot.dataSourceId}/data?snapshotId=${snapshot.id}&limit=1000000`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch snapshot data');
      }

      const result = await response.json();
      const data = result.data || [];

      if (data.length === 0) {
        alert('No data to download for this snapshot');
        return;
      }

      // Convert to CSV format
      const headers = Object.keys(data[0] || {});
      const csvRows = [
        headers.join(','), // Header row
        ...data.map((row: any) => 
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${snapshot.dataSourceName}_v${snapshot.version}_${snapshot.id}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Downloaded snapshot: ${snapshot.dataSourceName} v${snapshot.version}`);
    } catch (error) {
      console.error('Failed to download snapshot:', error);
      alert(`❌ Failed to download snapshot\n\n${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredSnapshots.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedSnapshots = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredSnapshots.slice(start, end);
  }, [filteredSnapshots, currentPage, pageSize]);

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

  if (loading) {
    return (
      <PageLayout
        title="Data Snapshots"
        subtitle="Version history and data backups"
        icon={FileText}
        showNavigation={true}
        showBackButton={true}
        backButtonText="Back to Home"
        backButtonHref="/"
      >
        <div className="space-y-4">
          <CellCard className="p-8">
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          </CellCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CellCard className="p-6">
              <div className="h-5 w-40 bg-gray-200 animate-pulse mb-4" />
              <div className="h-4 w-24 bg-gray-200 animate-pulse" />
            </CellCard>
            <CellCard className="p-6">
              <div className="h-5 w-40 bg-gray-200 animate-pulse mb-4" />
              <div className="h-4 w-24 bg-gray-200 animate-pulse" />
            </CellCard>
          </div>
        </div>
      </PageLayout>
    );
  }

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
          <div className="flex items-center space-x-2">
            <span className="text-white">Keep last</span>
            <input
              type="number"
              min={0}
              value={keepCount}
              onChange={(e) => setKeepCount(Math.max(0, Number(e.target.value)))}
              className="w-16 px-2 py-1 border border-gray-300 bg-white rounded text-sm"
              aria-label="Keep count"
            />
            <span className="text-white">for</span>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-2 py-1 border border-gray-300 bg-white rounded text-sm"
              aria-label="Cleanup data source"
            >
              <option value="all">Select source…</option>
              {uniqueSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
            <CellButton
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  const sourceId = filterSource !== 'all' ? filterSource : undefined;
                  if (!sourceId) {
                    alert('Please select a data source first');
                    return;
                  }
                  if (!confirm(`Delete old snapshots for this source?\n\nKeep last: ${keepCount}\nSource: ${uniqueSources.find(s => s.id === sourceId)?.name}\n\nOlder snapshots will be deleted.`)) {
                    return;
                  }
                  const resp = await fetch('/api/snapshots/cleanup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ projectId: 'default', dataSourceId: sourceId, keep: keepCount })
                  });
                  if (!resp.ok) {
                    const err = await resp.json();
                    alert(`Cleanup failed: ${err.error || 'Unknown error'}`);
                    return;
                  }
                  const result = await resp.json();
                  alert(`✅ Cleanup complete!\n\nDeleted: ${result.deletedCount}\nKept: ${result.keptCount}`);
                  window.location.reload();
                } catch (e) {
                  alert('❌ Cleanup failed. See console for details.');
                  console.error(e);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clean Up Old Snapshots
            </CellButton>
          </div>
          <CellButton variant="secondary" size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
          </CellButton>
          <CellButton variant="secondary" size="sm" onClick={() => router.push('/settings')}>
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
            <div className="ml-8 flex items-center space-x-4">
            
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
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border-2 border-black bg-white font-mono text-sm"
                aria-label="From date"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border-2 border-black bg-white font-mono text-sm"
                aria-label="To date"
              />
              <select
                value={pageSize}
                onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                className="px-3 py-2 border-2 border-black bg-white font-mono text-sm"
                aria-label="Page size"
              >
                {[10,20,50,100].map(s => (
                  <option key={s} value={s}>{s}/page</option>
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
          {pagedSnapshots.map((snapshot) => (
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
                    <CellButton 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDownloadSnapshot(snapshot)}
                      title="Download as CSV"
                    >
                      <Download className="w-4 h-4" />
                    </CellButton>
                    <CellButton 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDeleteSnapshot(snapshot.id, `${snapshot.dataSourceName} v${snapshot.version}`)}
                      disabled={deletingSnapshot === snapshot.id}
                    >
                      <Trash2 className={`w-4 h-4 ${deletingSnapshot === snapshot.id ? 'animate-pulse text-red-500' : ''}`} />
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
          <div className="flex items-center justify-between mt-4">
            <span className="text-caption">
              Page {currentPage} of {totalPages} • {filteredSnapshots.length} total
            </span>
            <div className="flex items-center space-x-2">
              <CellButton
                variant="ghost"
                size="sm"
                onClick={() => setPage(1)}
                disabled={currentPage === 1}
              >
                First
              </CellButton>
              <CellButton
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Prev
              </CellButton>
              <CellButton
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </CellButton>
              <CellButton
                variant="ghost"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </CellButton>
            </div>
          </div>
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
