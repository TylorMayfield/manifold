"use client";

import React from "react";
import { DataDictionaryEntry } from "../../types/dataDictionary";
import CellCard from "../ui/CellCard";
import CellBadge from "../ui/CellBadge";
import CellButton from "../ui/CellButton";
import { Database, Edit, Trash2, Eye, GitBranch, AlertCircle } from "lucide-react";

interface DataDictionaryCardProps {
  entry: DataDictionaryEntry;
  onView: (entry: DataDictionaryEntry) => void;
  onEdit: (entry: DataDictionaryEntry) => void;
  onDelete: (entry: DataDictionaryEntry) => void;
}

export function DataDictionaryCard({
  entry,
  onView,
  onEdit,
  onDelete,
}: DataDictionaryCardProps) {
  const qualityScore = entry.dataQuality?.overallScore;
  const getQualityColor = (score?: number) => {
    if (!score) return "gray";
    if (score >= 80) return "green";
    if (score >= 60) return "yellow";
    return "red";
  };

  return (
    <CellCard className="hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <div>
              <h3 className="text-lg font-bold">{entry.businessName}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {entry.technicalName}
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => onView(entry)}
              title="View Details"
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEdit(entry)}
              title="Edit"
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(entry)}
              title="Delete"
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2">
          {entry.description || "No description provided"}
        </p>

        <div className="flex flex-wrap gap-2">
          {entry.category && (
            <CellBadge variant="info">{entry.category}</CellBadge>
          )}
          {entry.domain && (
            <CellBadge variant="default">{entry.domain}</CellBadge>
          )}
          {entry.tags.slice(0, 3).map((tag) => (
            <CellBadge key={tag} variant="success" className="text-xs">
              {tag}
            </CellBadge>
          ))}
          {entry.tags.length > 3 && (
            <CellBadge variant="default" className="text-xs">
              +{entry.tags.length - 3} more
            </CellBadge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
          <div className="text-center">
            <div className="font-semibold text-blue-600">{entry.fields.length}</div>
            <div className="text-xs text-gray-500">Fields</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-purple-600">
              {entry.relationships.length}
            </div>
            <div className="text-xs text-gray-500">Relations</div>
          </div>
          <div className="text-center">
            {qualityScore !== undefined ? (
              <>
                <div
                  className={`font-semibold text-${getQualityColor(qualityScore)}-600`}
                >
                  {qualityScore}%
                </div>
                <div className="text-xs text-gray-500">Quality</div>
              </>
            ) : (
              <>
                <div className="text-gray-400">-</div>
                <div className="text-xs text-gray-500">Quality</div>
              </>
            )}
          </div>
        </div>

        {entry.relationships.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-600 pt-2">
            <GitBranch className="h-3 w-3" />
            <span>Connected to {entry.relationships.length} data source(s)</span>
          </div>
        )}

        {entry.dataQuality?.issues && entry.dataQuality.issues.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-orange-600 pt-1">
            <AlertCircle className="h-3 w-3" />
            <span>{entry.dataQuality.issues.length} quality issue(s)</span>
          </div>
        )}

        {entry.owner && (
          <div className="text-xs text-gray-500 pt-1">
            Owner: <span className="text-gray-700">{entry.owner}</span>
          </div>
        )}
      </div>
    </CellCard>
  );
}

