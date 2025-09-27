"use client";

import React, { useState, useEffect } from "react";
import { Clock, RefreshCw, Database } from "lucide-react";
import { clientLogger } from "../../lib/utils/ClientLogger";
import { clientDatabaseService } from "../../lib/database/ClientDatabaseService";
import { SnapshotUtils } from "../../lib/utils/snapshotUtils";
import Button from "../ui/Button";
import {
  ImportHistoryItem,
  ImportTimelineProps,
} from "../../types/importTimeline";
import ImportTimelineHeader from "./ImportTimelineHeader";
import ImportTimelineItem from "./ImportTimelineItem";
import DiffViewer from "./DiffViewer";
import ComparisonModal from "./ComparisonModal";

export default function ImportTimeline({
  projectId,
  refreshTrigger,
}: ImportTimelineProps) {
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [selectedDiff, setSelectedDiff] = useState<{
    currentData: any[];
    previousData: any[];
    dataSourceName: string;
    timestamp: Date;
  } | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<ImportHistoryItem[]>([]);
  const [comparisonData, setComparisonData] = useState<{
    leftData: any[];
    rightData: any[];
    leftItem: ImportHistoryItem;
    rightItem: ImportHistoryItem;
  } | null>(null);

  const dbService = clientDatabaseService;

  // Handle item selection for comparison
  const handleItemSelect = (item: ImportHistoryItem) => {
    setSelectedItems((prev) => {
      if (prev.find((i) => i.id === item.id)) {
        // Remove if already selected
        return prev.filter((i) => i.id !== item.id);
      } else if (prev.length < 2) {
        // Add if less than 2 selected
        return [...prev, item];
      } else {
        // Replace the first item if 2 already selected
        return [prev[1], item];
      }
    });
  };

  // Handle comparison
  const handleComparison = async () => {
    if (selectedItems.length !== 2) return;

    try {
      setLoading(true);

      const [leftItem, rightItem] = selectedItems;

      // Get snapshot data for both items
      const allSnapshots = await dbService.getSnapshots(projectId);
      const leftSnapshots = allSnapshots.filter(
        (s) => s.dataSourceId === leftItem.dataSourceId
      );
      const rightSnapshots = allSnapshots.filter(
        (s) => s.dataSourceId === rightItem.dataSourceId
      );

      if (leftSnapshots.length === 0 || rightSnapshots.length === 0) {
        alert("No snapshot data available for comparison");
        return;
      }

      // Use the most recent snapshots
      const leftData = leftSnapshots.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0].data;
      const rightData = rightSnapshots.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0].data;

      setComparisonData({
        leftData,
        rightData,
        leftItem,
        rightItem,
      });

      setShowComparisonModal(true);
    } catch (error) {
      console.error("Failed to load comparison data:", error);
      alert("Failed to load data for comparison");
    } finally {
      setLoading(false);
    }
  };

  const loadImportHistory = React.useCallback(async () => {
    try {
      setLoading(true);

      // Get data sources to map IDs to names
      const dataSources = await dbService.getDataSources(projectId);
      console.log("ImportTimeline: Loaded data sources:", dataSources);

      // Get snapshots (import history)
      const snapshots = await dbService.getSnapshots(projectId);
      console.log("ImportTimeline: Loaded snapshots:", snapshots);

      // Convert snapshots to import history items
      const historyItems: ImportHistoryItem[] = snapshots
        .map((snapshot, index) => {
          const dataSource = dataSources.find(
            (ds) => ds.id === snapshot.dataSourceId
          );
          const data = snapshot.data || [];
          const recordCount = Array.isArray(data) ? data.length : 0;

          // Determine change type
          let changeType: "new" | "update" | "reimport" = "new";
          let previousRecordCount: number | undefined;

          if (index > 0) {
            const previousSnapshot = snapshots[index - 1];
            if (previousSnapshot.dataSourceId === snapshot.dataSourceId) {
              previousRecordCount = Array.isArray(previousSnapshot.data)
                ? previousSnapshot.data.length
                : 0;
              changeType =
                previousRecordCount === recordCount ? "reimport" : "update";
            }
          }

          return {
            id: snapshot.id,
            dataSourceId: snapshot.dataSourceId,
            dataSourceName: dataSource?.name || "Unknown Source",
            dataSourceType: dataSource?.type || "unknown",
            timestamp: new Date(snapshot.createdAt),
            recordCount,
            previousRecordCount,
            changeType,
            metadata: {
              fileSize: snapshot.metadata?.fileSize,
              columns:
                snapshot.metadata?.columns ||
                (Array.isArray(data) && data.length > 0
                  ? Object.keys(data[0]).length
                  : 0),
              schema: snapshot.metadata?.schema,
            },
          };
        })
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first

      setImportHistory(historyItems);

      clientLogger.info(
        "Import history loaded",
        "data-processing",
        {
          projectId,
          historyCount: historyItems.length,
          dataSourceCount: dataSources.length,
        },
        "ImportTimeline"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to load import history",
        "data-processing",
        { error, projectId },
        "ImportTimeline"
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadImportHistory();
  }, [loadImportHistory, refreshTrigger]);

  // Add a function to create snapshots for existing data sources
  const createSnapshotsForExistingDataSources = React.useCallback(async () => {
    try {
      console.log("Creating snapshots for existing data sources...");
      const dataSources = await dbService.getDataSources(projectId);
      const existingSnapshots = await dbService.getSnapshots(projectId);

      console.log("Found data sources:", dataSources.length);
      console.log("Found existing snapshots:", existingSnapshots.length);

      // Create snapshots for data sources that don't have snapshots
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

      // Reload the import history
      await loadImportHistory();
    } catch (error) {
      console.error(
        "Failed to create snapshots for existing data sources:",
        error
      );
    }
  }, [projectId, loadImportHistory]);

  const handleViewDiff = async (item: ImportHistoryItem) => {
    try {
      console.log("handleViewDiff called for item:", item);

      // Get current and previous data for comparison
      const snapshots = await dbService.getSnapshots(projectId);
      console.log("All snapshots:", snapshots.length);

      const currentSnapshot = snapshots.find((s) => s.id === item.id);
      console.log("Current snapshot found:", !!currentSnapshot);

      const previousSnapshot = snapshots.find(
        (s) =>
          s.dataSourceId === item.dataSourceId &&
          new Date(s.createdAt) < new Date(item.timestamp)
      );
      console.log("Previous snapshot found:", !!previousSnapshot);

      if (currentSnapshot && previousSnapshot) {
        console.log("Setting up diff with data:", {
          currentDataLength: currentSnapshot.data?.length || 0,
          previousDataLength: previousSnapshot.data?.length || 0,
          currentSnapshotId: currentSnapshot.id,
          previousSnapshotId: previousSnapshot.id,
          currentCreatedAt: currentSnapshot.createdAt,
          previousCreatedAt: previousSnapshot.createdAt,
        });

        setSelectedDiff({
          currentData: currentSnapshot.data || [],
          previousData: previousSnapshot.data || [],
          dataSourceName: item.dataSourceName,
          timestamp: item.timestamp,
        });
        setShowDiffModal(true);

        console.log("Diff modal should now be open");
      } else if (currentSnapshot && !previousSnapshot) {
        // Show a special diff for first import (no previous data)
        console.log("First import detected - showing current data only");

        setSelectedDiff({
          currentData: currentSnapshot.data || [],
          previousData: [], // Empty array for first import
          dataSourceName: item.dataSourceName,
          timestamp: item.timestamp,
        });
        setShowDiffModal(true);
      } else {
        console.warn("Cannot show diff - missing snapshots:", {
          hasCurrent: !!currentSnapshot,
          hasPrevious: !!previousSnapshot,
          itemId: item.id,
          dataSourceId: item.dataSourceId,
          timestamp: item.timestamp,
        });

        // Show a user-friendly message
        alert(
          "Unable to show diff - previous version not found. This might be the first import of this data source."
        );
      }
    } catch (error) {
      console.error("Failed to load diff data:", error);
      clientLogger.error(
        "Failed to load diff data",
        "data-processing",
        { error, itemId: item.id },
        "ImportTimeline"
      );

      // Show a user-friendly error message
      alert("Failed to load diff data. Please try again.");
    }
  };

  const handleViewDiffs = () => {
    console.log("Header View Diffs button clicked");
    console.log("Import history items:", importHistory.length);
    console.log("First item:", importHistory[0]);
    if (importHistory.length > 0) {
      handleViewDiff(importHistory[0]);
    } else {
      alert("No import history items available to show diff");
    }
  };

  const handleCloseComparison = () => {
    setShowComparisonModal(false);
    setComparisonData(null);
    setSelectedItems([]);
  };

  const handleCloseDiff = () => {
    setShowDiffModal(false);
    setSelectedDiff(null);
  };

  if (loading) {
    return (
      <div className="card rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-subheading text-white">Import Timeline</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (importHistory.length === 0) {
    return (
      <div className="card rounded-2xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Clock className="h-5 w-5 text-blue-400" />
          <h3 className="text-subheading text-white">Import Timeline</h3>
        </div>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60">No import history yet</p>
          <p className="text-white/40 text-sm mb-4">
            Data imports will appear here
          </p>
          <div className="flex space-x-3 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadImportHistory}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={createSnapshotsForExistingDataSources}
              disabled={loading}
            >
              <Database className="h-4 w-4 mr-2" />
              Create Missing Snapshots
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card rounded-2xl p-6">
        <ImportTimelineHeader
          importHistoryCount={importHistory.length}
          selectedItemsCount={selectedItems.length}
          loading={loading}
          onRefresh={loadImportHistory}
          onViewDiffs={handleViewDiffs}
          onCompare={handleComparison}
          canCompare={selectedItems.length === 2}
        />

        <div className="space-y-4">
          {importHistory.map((item, index) => (
            <ImportTimelineItem
              key={item.id}
              item={item}
              index={index}
              totalItems={importHistory.length}
              isSelected={selectedItems.some((i) => i.id === item.id)}
              onSelect={handleItemSelect}
              onViewDiff={handleViewDiff}
              selectionNumber={
                selectedItems.find((i) => i.id === item.id)
                  ? selectedItems.findIndex((i) => i.id === item.id) + 1
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Diff Viewer Modal */}
      {selectedDiff && (
        <DiffViewer
          isOpen={showDiffModal}
          onClose={handleCloseDiff}
          currentData={selectedDiff.currentData}
          previousData={selectedDiff.previousData}
          dataSourceName={selectedDiff.dataSourceName}
          timestamp={selectedDiff.timestamp}
        />
      )}

      {/* Comparison Modal */}
      {comparisonData && (
        <ComparisonModal
          isOpen={showComparisonModal}
          onClose={handleCloseComparison}
          comparisonData={comparisonData}
        />
      )}
    </>
  );
}
