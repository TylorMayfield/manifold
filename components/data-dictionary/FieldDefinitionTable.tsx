"use client";

import React from "react";
import { FieldDefinition } from "../../types/dataDictionary";
import CellButton from "../ui/CellButton";
import CellBadge from "../ui/CellBadge";
import { Edit, Trash2, Plus, Key, Lock, Info } from "lucide-react";

interface FieldDefinitionTableProps {
  fields: FieldDefinition[];
  onAdd: () => void;
  onEdit: (field: FieldDefinition) => void;
  onDelete: (fieldId: string) => void;
}

export function FieldDefinitionTable({
  fields,
  onAdd,
  onEdit,
  onDelete,
}: FieldDefinitionTableProps) {
  const getSensitivityColor = (sensitivity?: string) => {
    switch (sensitivity) {
      case "pii":
      case "pci":
      case "restricted":
        return "destructive";
      case "confidential":
        return "warning";
      case "internal":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Field Definitions</h3>
        <CellButton onClick={onAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </CellButton>
      </div>

      <div className="border-2 border-black rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b-2 border-black">
            <tr>
              <th className="w-[30px] p-3 text-left font-mono text-sm"></th>
              <th className="p-3 text-left font-mono text-sm">Name</th>
              <th className="p-3 text-left font-mono text-sm">Type</th>
              <th className="p-3 text-left font-mono text-sm">Description</th>
              <th className="p-3 text-left font-mono text-sm">Constraints</th>
              <th className="p-3 text-left font-mono text-sm">Sensitivity</th>
              <th className="p-3 text-right font-mono text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-8 p-3">
                  No fields defined. Click &quot;Add Field&quot; to get started.
                </td>
              </tr>
            ) : (
              fields.map((field) => (
                <tr key={field.id} className="border-b border-gray-200">
                  <td className="p-3">
                    {field.isPrimaryKey && (
                      <span title="Primary Key">
                        <Key className="h-4 w-4 text-yellow-600" />
                      </span>
                    )}
                    {field.isForeignKey && (
                      <span title="Foreign Key">
                        <Key className="h-4 w-4 text-blue-600" />
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-medium">
                    <div>
                      <div>{field.displayName || field.name}</div>
                      {field.displayName && (
                        <div className="text-xs text-gray-500">{field.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {field.dataType}
                    </code>
                    {field.technicalType && (
                      <div className="text-xs text-gray-500 mt-1">
                        {field.technicalType}
                      </div>
                    )}
                  </td>
                  <td className="p-3 max-w-md">
                    <p className="text-sm line-clamp-2">{field.description}</p>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {field.nullable && (
                        <CellBadge variant="default" className="text-xs">
                          Nullable
                        </CellBadge>
                      )}
                      {field.isUnique && (
                        <CellBadge variant="info" className="text-xs">
                          Unique
                        </CellBadge>
                      )}
                      {field.isIndexed && (
                        <CellBadge variant="info" className="text-xs">
                          Indexed
                        </CellBadge>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {field.sensitivity && (
                      <CellBadge
                        variant={
                          field.sensitivity === "pii" || field.sensitivity === "pci"
                            ? "error"
                            : "warning"
                        }
                        className="text-xs"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        {field.sensitivity.toUpperCase()}
                      </CellBadge>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => onEdit(field)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(field.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {fields.length > 0 && (
        <div className="text-sm text-gray-600">
          Total: {fields.length} field{fields.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

