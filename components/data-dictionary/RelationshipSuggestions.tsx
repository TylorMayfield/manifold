"use client";

import React, { useState } from "react";
import { RelationshipSuggestion } from "../../lib/services/RelationshipDetectionService";
import CellCard from "../ui/CellCard";
import CellButton from "../ui/CellButton";
import CellBadge from "../ui/CellBadge";
import { Sparkles, Check, X, Info, Zap, AlertCircle } from "lucide-react";

interface RelationshipSuggestionsProps {
  suggestions: RelationshipSuggestion[];
  entryName: string;
  onAccept: (suggestionIds: string[]) => Promise<void>;
  onReject: () => void;
}

export function RelationshipSuggestions({
  suggestions,
  entryName,
  onAccept,
  onReject,
}: RelationshipSuggestionsProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [accepting, setAccepting] = useState(false);

  if (suggestions.length === 0) {
    return (
      <CellCard className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <h3 className="font-semibold text-gray-700 mb-2">No Suggestions Found</h3>
        <p className="text-sm text-gray-600">
          No potential relationships were detected for this entry.
          Try adding more fields or connecting more data sources.
        </p>
      </CellCard>
    );
  }

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(suggestions.map((s) => s.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAccept = async () => {
    if (selectedIds.size === 0) return;

    try {
      setAccepting(true);
      await onAccept(Array.from(selectedIds));
    } catch (error) {
      console.error("Failed to accept suggestions:", error);
      alert("Failed to accept suggestions");
    } finally {
      setAccepting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-orange-600";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return { variant: "success" as const, label: "High" };
    if (confidence >= 60) return { variant: "warning" as const, label: "Medium" };
    return { variant: "error" as const, label: "Low" };
  };

  // Group suggestions by confidence
  const highConfidence = suggestions.filter((s) => s.confidence >= 80);
  const mediumConfidence = suggestions.filter((s) => s.confidence >= 60 && s.confidence < 80);
  const lowConfidence = suggestions.filter((s) => s.confidence < 60);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">
            Relationship Suggestions for "{entryName}"
          </h3>
        </div>
        <div className="flex gap-2">
          <CellButton
            variant="secondary"
            size="sm"
            onClick={deselectAll}
            disabled={selectedIds.size === 0}
          >
            Deselect All
          </CellButton>
          <CellButton
            variant="secondary"
            size="sm"
            onClick={selectAll}
          >
            Select All
          </CellButton>
        </div>
      </div>

      {/* Summary */}
      <CellCard variant="accent" className="p-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Total:</span>
            <span>{suggestions.length}</span>
          </div>
          {highConfidence.length > 0 && (
            <div className="flex items-center gap-2">
              <CellBadge variant="success" size="sm">High Confidence</CellBadge>
              <span>{highConfidence.length}</span>
            </div>
          )}
          {mediumConfidence.length > 0 && (
            <div className="flex items-center gap-2">
              <CellBadge variant="warning" size="sm">Medium Confidence</CellBadge>
              <span>{mediumConfidence.length}</span>
            </div>
          )}
          {lowConfidence.length > 0 && (
            <div className="flex items-center gap-2">
              <CellBadge variant="error" size="sm">Low Confidence</CellBadge>
              <span>{lowConfidence.length}</span>
            </div>
          )}
        </div>
      </CellCard>

      {/* Suggestions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {suggestions.map((suggestion, index) => {
          const isSelected = selectedIds.has(suggestion.id);
          const badge = getConfidenceBadge(suggestion.confidence);

          return (
            <CellCard
              key={suggestion.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? "border-2 border-blue-500 bg-blue-50"
                  : "hover:border-gray-400"
              }`}
              onClick={() => toggleSelection(suggestion.id)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className="pt-1">
                  <div
                    className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  {/* Suggestion Number & Confidence */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-500">
                        #{index + 1}
                      </span>
                      <CellBadge variant={badge.variant} size="sm">
                        {badge.label} - {suggestion.confidence}%
                      </CellBadge>
                      <CellBadge variant="default" size="sm">
                        {suggestion.relationshipType.replace(/_/g, "-")}
                      </CellBadge>
                    </div>
                  </div>

                  {/* Relationship Details */}
                  <div className="flex items-center gap-2 text-sm">
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                      {/* We'll need to look up field names from IDs */}
                      Field
                    </code>
                    <Zap className="h-4 w-4 text-gray-400" />
                    <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                      Target Field
                    </code>
                  </div>

                  {/* Evidence */}
                  {suggestion.evidence && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {suggestion.evidence.nameMatch && (
                        <CellBadge variant="info" size="sm">
                          Name: {Math.round(suggestion.evidence.nameMatch)}%
                        </CellBadge>
                      )}
                      {suggestion.evidence.typeMatch && (
                        <CellBadge variant="success" size="sm">
                          Types Match
                        </CellBadge>
                      )}
                      {suggestion.evidence.cardinalityMatch && (
                        <CellBadge variant="info" size="sm">
                          {suggestion.evidence.cardinalityMatch}
                        </CellBadge>
                      )}
                      {suggestion.evidence.valueOverlap && (
                        <CellBadge variant="info" size="sm">
                          Overlap: {Math.round(suggestion.evidence.valueOverlap)}%
                        </CellBadge>
                      )}
                    </div>
                  )}

                  {/* Reasoning */}
                  {suggestion.reasoning && suggestion.reasoning.length > 0 && (
                    <div className="bg-gray-50 rounded p-2 text-xs space-y-1">
                      <div className="flex items-center gap-1 text-gray-600 font-semibold">
                        <Info className="h-3 w-3" />
                        <span>Why this suggestion:</span>
                      </div>
                      <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                        {suggestion.reasoning.map((reason, i) => (
                          <li key={i}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CellCard>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        <CellButton variant="secondary" onClick={onReject}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </CellButton>
        <CellButton
          onClick={handleAccept}
          disabled={selectedIds.size === 0 || accepting}
        >
          <Check className="h-4 w-4 mr-2" />
          {accepting
            ? "Adding Relationships..."
            : `Accept ${selectedIds.size} Suggestion${selectedIds.size !== 1 ? "s" : ""}`}
        </CellButton>
      </div>
    </div>
  );
}

