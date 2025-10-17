"use client";

import React from "react";
import { DataRelationship } from "../../types/dataDictionary";
import CellButton from "../ui/CellButton";
import CellBadge from "../ui/CellBadge";
import CellCard from "../ui/CellCard";
import { Plus, Trash2, GitBranch, ArrowRight, Check, X } from "lucide-react";

interface RelationshipViewerProps {
  relationships: DataRelationship[];
  onAdd: () => void;
  onDelete: (relationshipId: string) => void;
}

export function RelationshipViewer({
  relationships,
  onAdd,
  onDelete,
}: RelationshipViewerProps) {
  const getRelationshipTypeColor = (type: string) => {
    switch (type) {
      case "one_to_one":
        return "bg-blue-100 text-blue-800";
      case "one_to_many":
      case "many_to_one":
        return "bg-purple-100 text-purple-800";
      case "many_to_many":
        return "bg-pink-100 text-pink-800";
      case "lookup":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatRelationType = (type: string) => {
    return type.split("_").map((word) =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(" ");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Relationships</h3>
        </div>
        <CellButton onClick={onAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Relationship
        </CellButton>
      </div>

      {relationships.length === 0 ? (
        <CellCard className="py-8 text-center text-gray-500">
          No relationships defined. Click &quot;Add Relationship&quot; to connect this data source with others.
        </CellCard>
      ) : (
        <div className="space-y-3">
          {relationships.map((rel) => (
            <CellCard key={rel.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Relationship Type */}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getRelationshipTypeColor(rel.type)}`}>
                        {formatRelationType(rel.type)}
                      </span>
                      {rel.relationshipStrength && (
                        <CellBadge
                          variant={
                            rel.relationshipStrength === "strong"
                              ? "success"
                              : rel.relationshipStrength === "weak"
                              ? "warning"
                              : "default"
                          }
                        >
                          {rel.relationshipStrength}
                        </CellBadge>
                      )}
                      {rel.isValidated ? (
                        <CellBadge variant="success" className="text-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Validated
                        </CellBadge>
                      ) : (
                        <CellBadge variant="default" className="text-gray-500">
                          <X className="h-3 w-3 mr-1" />
                          Not Validated
                        </CellBadge>
                      )}
                    </div>

                    {/* Connection Details */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded">
                        <code className="font-mono font-semibold">
                          {rel.sourceFieldName}
                        </code>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      
                      <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded">
                        <div>
                          <div className="font-semibold">
                            {rel.targetDataSourceName}
                          </div>
                          <code className="text-xs font-mono text-gray-600">
                            {rel.targetFieldName}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Additional Details */}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      {rel.joinType && (
                        <div>
                          <span className="font-semibold">Join:</span>{" "}
                          <code>{rel.joinType.toUpperCase()}</code>
                        </div>
                      )}
                      {rel.cardinality && (
                        <div>
                          <span className="font-semibold">Cardinality:</span>{" "}
                          {rel.cardinality}
                        </div>
                      )}
                      {rel.createdBy && (
                        <div>
                          <span className="font-semibold">Created by:</span>{" "}
                          {rel.createdBy}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {rel.description && (
                      <p className="text-sm text-gray-700 italic">
                        {rel.description}
                      </p>
                    )}

                    {/* Validation Notes */}
                    {rel.validationNotes && (
                      <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                        <span className="font-semibold">Validation Notes:</span>{" "}
                        {rel.validationNotes}
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDelete(rel.id)}
                    title="Delete Relationship"
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
            </CellCard>
          ))}
        </div>
      )}

      {relationships.length > 0 && (
        <div className="text-sm text-gray-600">
          Total: {relationships.length} relationship{relationships.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

