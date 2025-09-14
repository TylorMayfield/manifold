"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  Plus,
  Minus,
  Equal,
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import Input from "./Input";

export interface SearchCondition {
  id: string;
  column: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "starts_with"
    | "ends_with"
    | "greater_than"
    | "less_than"
    | "greater_equal"
    | "less_equal"
    | "is_null"
    | "is_not_null"
    | "in"
    | "not_in";
  value: string;
  valueType: "string" | "number" | "date" | "boolean";
}

export interface SearchGroup {
  id: string;
  conditions: SearchCondition[];
  operator: "AND" | "OR";
}

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (searchGroups: SearchGroup[]) => void;
  columns: Array<{ key: string; label: string; type?: string }>;
  className?: string;
}

export default function AdvancedSearchModal({
  isOpen,
  onClose,
  onSearch,
  columns,
  className = "",
}: AdvancedSearchModalProps) {
  const [searchGroups, setSearchGroups] = useState<SearchGroup[]>([
    {
      id: "group_1",
      conditions: [
        {
          id: "condition_1",
          column: columns[0]?.key || "",
          operator: "contains",
          value: "",
          valueType: "string",
        },
      ],
      operator: "AND",
    },
  ]);

  const getColumnType = (
    columnKey: string
  ): "string" | "number" | "date" | "boolean" => {
    const column = columns.find((col) => col.key === columnKey);
    if (!column) return "string";

    // Try to detect type from column info or default to string
    if (column.type) {
      if (
        column.type.includes("number") ||
        column.type.includes("int") ||
        column.type.includes("float")
      )
        return "number";
      if (column.type.includes("date") || column.type.includes("time"))
        return "date";
      if (column.type.includes("bool")) return "boolean";
    }

    return "string";
  };

  const getOperatorsForType = (type: string) => {
    switch (type) {
      case "string":
        return [
          { value: "contains", label: "Contains", icon: Search },
          { value: "not_contains", label: "Does not contain", icon: X },
          { value: "equals", label: "Equals", icon: Equal },
          { value: "not_equals", label: "Not equals", icon: X },
          { value: "starts_with", label: "Starts with", icon: Type },
          { value: "ends_with", label: "Ends with", icon: Type },
          { value: "is_null", label: "Is null", icon: Minus },
          { value: "is_not_null", label: "Is not null", icon: Plus },
        ];
      case "number":
        return [
          { value: "equals", label: "Equals", icon: Equal },
          { value: "not_equals", label: "Not equals", icon: X },
          { value: "greater_than", label: "Greater than", icon: ChevronUp },
          { value: "less_than", label: "Less than", icon: ChevronDown },
          {
            value: "greater_equal",
            label: "Greater or equal",
            icon: ChevronUp,
          },
          { value: "less_equal", label: "Less or equal", icon: ChevronDown },
          { value: "is_null", label: "Is null", icon: Minus },
          { value: "is_not_null", label: "Is not null", icon: Plus },
        ];
      case "date":
        return [
          { value: "equals", label: "Equals", icon: Equal },
          { value: "not_equals", label: "Not equals", icon: X },
          { value: "greater_than", label: "After", icon: ChevronUp },
          { value: "less_than", label: "Before", icon: ChevronDown },
          { value: "greater_equal", label: "On or after", icon: ChevronUp },
          { value: "less_equal", label: "On or before", icon: ChevronDown },
          { value: "is_null", label: "Is null", icon: Minus },
          { value: "is_not_null", label: "Is not null", icon: Plus },
        ];
      case "boolean":
        return [
          { value: "equals", label: "Equals", icon: Equal },
          { value: "not_equals", label: "Not equals", icon: X },
          { value: "is_null", label: "Is null", icon: Minus },
          { value: "is_not_null", label: "Is not null", icon: Plus },
        ];
      default:
        return [
          { value: "contains", label: "Contains", icon: Search },
          { value: "equals", label: "Equals", icon: Equal },
        ];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "number":
        return <Hash className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "boolean":
        return <ToggleLeft className="h-4 w-4" />;
      default:
        return <Type className="h-4 w-4" />;
    }
  };

  const addCondition = (groupId: string) => {
    setSearchGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: [
                ...group.conditions,
                {
                  id: `condition_${Date.now()}`,
                  column: columns[0]?.key || "",
                  operator: "contains",
                  value: "",
                  valueType: "string",
                },
              ],
            }
          : group
      )
    );
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setSearchGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.filter((c) => c.id !== conditionId),
            }
          : group
      )
    );
  };

  const updateCondition = (
    groupId: string,
    conditionId: string,
    updates: Partial<SearchCondition>
  ) => {
    setSearchGroups((groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: group.conditions.map((condition) =>
                condition.id === conditionId
                  ? { ...condition, ...updates }
                  : condition
              ),
            }
          : group
      )
    );
  };

  const addGroup = () => {
    setSearchGroups((groups) => [
      ...groups,
      {
        id: `group_${Date.now()}`,
        conditions: [
          {
            id: `condition_${Date.now()}`,
            column: columns[0]?.key || "",
            operator: "contains",
            value: "",
            valueType: "string",
          },
        ],
        operator: "AND",
      },
    ]);
  };

  const removeGroup = (groupId: string) => {
    if (searchGroups.length > 1) {
      setSearchGroups((groups) =>
        groups.filter((group) => group.id !== groupId)
      );
    }
  };

  const handleSearch = () => {
    // Filter out empty conditions
    const validGroups = searchGroups
      .map((group) => ({
        ...group,
        conditions: group.conditions.filter(
          (condition) =>
            condition.value.trim() !== "" ||
            condition.operator === "is_null" ||
            condition.operator === "is_not_null"
        ),
      }))
      .filter((group) => group.conditions.length > 0);

    onSearch(validGroups);
    onClose();
  };

  const needsValue = (operator: string) => {
    return !["is_null", "is_not_null"].includes(operator);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Advanced Search" size="xl">
      <div className="space-y-6">
        {searchGroups.map((group, groupIndex) => (
          <div key={group.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Search Group {groupIndex + 1}
              </h3>
              <div className="flex items-center space-x-2">
                {searchGroups.length > 1 && (
                  <Button
                    onClick={() => removeGroup(group.id)}
                    variant="ghost"
                    size="sm"
                    icon={<Minus className="h-4 w-4" />}
                  >
                    Remove Group
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {group.conditions.map((condition, conditionIndex) => {
                const operators = getOperatorsForType(condition.valueType);
                const selectedOperator = operators.find(
                  (op) => op.value === condition.operator
                );

                return (
                  <div
                    key={condition.id}
                    className="flex items-center space-x-3"
                  >
                    {conditionIndex > 0 && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={group.operator}
                          onChange={(e) =>
                            setSearchGroups((groups) =>
                              groups.map((g) =>
                                g.id === group.id
                                  ? {
                                      ...g,
                                      operator: e.target.value as "AND" | "OR",
                                    }
                                  : g
                              )
                            )
                          }
                          className="input text-sm"
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      </div>
                    )}

                    {/* Column Selector */}
                    <select
                      value={condition.column}
                      onChange={(e) => {
                        const newColumn = e.target.value;
                        const newType = getColumnType(newColumn);
                        updateCondition(group.id, condition.id, {
                          column: newColumn,
                          valueType: newType,
                          operator: getOperatorsForType(newType)[0]
                            .value as any,
                          value: "",
                        });
                      }}
                      className="input text-sm min-w-32"
                    >
                      {columns.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label}
                        </option>
                      ))}
                    </select>

                    {/* Type Icon */}
                    <div className="text-white text-opacity-60">
                      {getTypeIcon(condition.valueType)}
                    </div>

                    {/* Operator Selector */}
                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(group.id, condition.id, {
                          operator: e.target.value as any,
                        })
                      }
                      className="input text-sm min-w-36"
                    >
                      {operators.map((op) => {
                        const Icon = op.icon;
                        return (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        );
                      })}
                    </select>

                    {/* Value Input */}
                    {needsValue(condition.operator) && (
                      <Input
                        value={condition.value}
                        onChange={(e) =>
                          updateCondition(group.id, condition.id, {
                            value: e.target.value,
                          })
                        }
                        placeholder={
                          condition.valueType === "number"
                            ? "Enter number"
                            : condition.valueType === "date"
                            ? "YYYY-MM-DD"
                            : condition.valueType === "boolean"
                            ? "true/false"
                            : "Enter value"
                        }
                        type={
                          condition.valueType === "number"
                            ? "number"
                            : condition.valueType === "date"
                            ? "date"
                            : "text"
                        }
                        className="flex-1"
                      />
                    )}

                    {/* Remove Condition Button */}
                    {group.conditions.length > 1 && (
                      <Button
                        onClick={() => removeCondition(group.id, condition.id)}
                        variant="ghost"
                        size="sm"
                        icon={<X className="h-4 w-4" />}
                      />
                    )}
                  </div>
                );
              })}

              {/* Add Condition Button */}
              <Button
                onClick={() => addCondition(group.id)}
                variant="outline"
                size="sm"
                icon={<Plus className="h-4 w-4" />}
              >
                Add Condition
              </Button>
            </div>
          </div>
        ))}

        {/* Add Group Button */}
        <Button
          onClick={addGroup}
          variant="outline"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
        >
          Add Search Group
        </Button>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-white border-opacity-10">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSearch} icon={<Search className="h-4 w-4" />}>
            Apply Search
          </Button>
        </div>
      </div>
    </Modal>
  );
}
