"use client";

import React, { useState } from "react";
import {
  GitBranch,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Hash,
} from "lucide-react";
import Modal from "../ui/Modal";

interface DiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: any[];
  previousData: any[];
  dataSourceName: string;
  timestamp: Date;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  isOpen,
  onClose,
  currentData,
  previousData,
  dataSourceName,
  timestamp,
}) => {
  const [activeTab, setActiveTab] = useState<
    "summary" | "added" | "removed" | "modified"
  >("summary");

  // Advanced diff calculation that compares records by content
  const calculateDiff = () => {
    console.log("Calculating diff with real data:", {
      currentDataLength: currentData.length,
      previousDataLength: previousData.length,
    });

    // Create maps of records by their content (using JSON string as key)
    const currentRecordsMap = new Map();
    const previousRecordsMap = new Map();

    // Index current data
    currentData.forEach((item, index) => {
      const key = JSON.stringify(item);
      currentRecordsMap.set(key, { ...item, _originalIndex: index });
    });

    // Index previous data
    previousData.forEach((item, index) => {
      const key = JSON.stringify(item);
      previousRecordsMap.set(key, { ...item, _originalIndex: index });
    });

    // Find added records (in current but not in previous)
    const added = [];
    for (const [key, record] of currentRecordsMap) {
      if (!previousRecordsMap.has(key)) {
        added.push(record);
      }
    }

    // Find removed records (in previous but not in current)
    const removed = [];
    for (const [key, record] of previousRecordsMap) {
      if (!currentRecordsMap.has(key)) {
        removed.push(record);
      }
    }

    // Find modified records using a more sophisticated approach
    // Compare records that might have the same ID but different content
    const modified = [];
    const processedKeys = new Set();

    // Try to match records by ID field if it exists
    const getIdField = (item: any) => {
      // Look for common ID field names
      return item.id || item.ID || item._id || item.record_id || item.key;
    };

    // Create maps by ID for better matching
    const currentById = new Map();
    const previousById = new Map();

    currentData.forEach((item) => {
      const id = getIdField(item);
      if (id !== undefined) {
        currentById.set(id, item);
      }
    });

    previousData.forEach((item) => {
      const id = getIdField(item);
      if (id !== undefined) {
        previousById.set(id, item);
      }
    });

    // Find modified records by comparing IDs
    for (const [id, currentItem] of currentById) {
      if (previousById.has(id)) {
        const previousItem = previousById.get(id);
        if (JSON.stringify(currentItem) !== JSON.stringify(previousItem)) {
          modified.push({
            current: currentItem,
            previous: previousItem,
            id: id,
          });
          processedKeys.add(id);
        }
      }
    }

    // For records without IDs, try to find potential matches by similarity
    // This is a fallback for records that don't have clear identifiers
    const currentWithoutId = currentData.filter((item) => !getIdField(item));
    const previousWithoutId = previousData.filter((item) => !getIdField(item));

    // Simple similarity matching for records without IDs
    for (const currentItem of currentWithoutId) {
      const currentKey = JSON.stringify(currentItem);
      if (processedKeys.has(currentKey)) continue;

      // Find the most similar previous record
      let bestMatch = null;
      let bestSimilarity = 0;

      for (const previousItem of previousWithoutId) {
        const similarity = calculateSimilarity(currentItem, previousItem);
        if (similarity > bestSimilarity && similarity > 0.7) {
          // 70% similarity threshold
          bestMatch = previousItem;
          bestSimilarity = similarity;
        }
      }

      if (
        bestMatch &&
        JSON.stringify(currentItem) !== JSON.stringify(bestMatch)
      ) {
        modified.push({
          current: currentItem,
          previous: bestMatch,
          similarity: bestSimilarity,
        });
      }
    }

    console.log("Diff calculation results:", {
      added: added.length,
      removed: removed.length,
      modified: modified.length,
    });

    return { added, removed, modified };
  };

  // Helper function to calculate similarity between two records
  const calculateSimilarity = (record1: any, record2: any) => {
    const keys1 = Object.keys(record1);
    const keys2 = Object.keys(record2);
    const commonKeys = keys1.filter((key) => keys2.includes(key));

    if (commonKeys.length === 0) return 0;

    let matches = 0;
    for (const key of commonKeys) {
      if (record1[key] === record2[key]) {
        matches++;
      }
    }

    return matches / commonKeys.length;
  };

  const diff = calculateDiff();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Data Diff: ${dataSourceName}`}
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <GitBranch className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="text-white font-medium">Import Comparison</h3>
              <p className="text-white/60 text-sm">
                {timestamp.toLocaleString()} • {currentData.length} vs{" "}
                {previousData.length} records
              </p>
            </div>
          </div>
          <div className="flex space-x-4 text-sm">
            <div className="flex items-center space-x-1 text-green-400">
              <TrendingUp className="h-4 w-4" />
              <span>+{diff.added.length}</span>
            </div>
            <div className="flex items-center space-x-1 text-red-400">
              <TrendingDown className="h-4 w-4" />
              <span>-{diff.removed.length}</span>
            </div>
            <div className="flex items-center space-x-1 text-yellow-400">
              <ArrowUpDown className="h-4 w-4" />
              <span>~{diff.modified.length}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-white/20">
          {[
            { id: "summary", label: "Summary", icon: Hash },
            {
              id: "added",
              label: `Added (${diff.added.length})`,
              icon: TrendingUp,
            },
            {
              id: "removed",
              label: `Removed (${diff.removed.length})`,
              icon: TrendingDown,
            },
            {
              id: "modified",
              label: `Modified (${diff.modified.length})`,
              icon: ArrowUpDown,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-medium">Added</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {diff.added.length}
                  </p>
                  <p className="text-white/60 text-sm">new records</p>
                </div>
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-red-400 font-medium">Removed</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {diff.removed.length}
                  </p>
                  <p className="text-white/60 text-sm">deleted records</p>
                </div>
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowUpDown className="h-4 w-4 text-yellow-400" />
                    <span className="text-yellow-400 font-medium">
                      Modified
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {diff.modified.length}
                  </p>
                  <p className="text-white/60 text-sm">changed records</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/20 rounded-lg">
                <h4 className="text-white font-medium mb-2">Change Summary</h4>
                {previousData.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-blue-400 text-sm font-medium">
                      🎉 First Import Detected
                    </p>
                    <p className="text-white/70 text-sm">
                      This is the first import of data for "{dataSourceName}".
                      All {currentData.length} records are new.
                    </p>
                  </div>
                ) : (
                  <p className="text-white/70 text-sm">
                    {diff.added.length > 0 &&
                      `${diff.added.length} new records were added. `}
                    {diff.removed.length > 0 &&
                      `${diff.removed.length} records were removed. `}
                    {diff.modified.length > 0 &&
                      `${diff.modified.length} records were modified. `}
                    {diff.added.length === 0 &&
                      diff.removed.length === 0 &&
                      diff.modified.length === 0 &&
                      "No changes detected between these versions."}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "added" && (
            <div className="space-y-2">
              {diff.added.length === 0 ? (
                <p className="text-white/60 text-center py-8">No new records</p>
              ) : (
                diff.added.slice(0, 10).map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                  >
                    <pre className="text-green-400 text-xs overflow-x-auto">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                ))
              )}
              {diff.added.length > 10 && (
                <p className="text-white/60 text-center py-2">
                  Showing first 10 of {diff.added.length} added records
                </p>
              )}
            </div>
          )}

          {activeTab === "removed" && (
            <div className="space-y-2">
              {diff.removed.length === 0 ? (
                <p className="text-white/60 text-center py-8">
                  No removed records
                </p>
              ) : (
                diff.removed.slice(0, 10).map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <pre className="text-red-400 text-xs overflow-x-auto">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                ))
              )}
              {diff.removed.length > 10 && (
                <p className="text-white/60 text-center py-2">
                  Showing first 10 of {diff.removed.length} removed records
                </p>
              )}
            </div>
          )}

          {activeTab === "modified" && (
            <div className="space-y-4">
              {diff.modified.length === 0 ? (
                <p className="text-white/60 text-center py-8">
                  No modified records
                </p>
              ) : (
                diff.modified.slice(0, 5).map((change, index) => (
                  <div
                    key={index}
                    className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <div className="mb-3">
                      <h4 className="text-yellow-400 font-medium text-sm mb-1">
                        {change.id
                          ? `Record ID: ${change.id}`
                          : `Modified Record ${index + 1}`}
                      </h4>
                      {change.similarity && (
                        <p className="text-yellow-300/70 text-xs">
                          Similarity: {(change.similarity * 100).toFixed(1)}%
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-red-400 text-xs font-medium mb-2 flex items-center">
                          <TrendingDown className="h-3 w-3 mr-1" />
                          Previous
                        </h5>
                        <pre className="text-red-300 text-xs overflow-x-auto bg-red-500/10 p-2 rounded">
                          {JSON.stringify(change.previous, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <h5 className="text-green-400 text-xs font-medium mb-2 flex items-center">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Current
                        </h5>
                        <pre className="text-green-300 text-xs overflow-x-auto bg-green-500/10 p-2 rounded">
                          {JSON.stringify(change.current, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {diff.modified.length > 5 && (
                <p className="text-white/60 text-center py-2">
                  Showing first 5 of {diff.modified.length} modified records
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default DiffViewer;
