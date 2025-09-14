"use client";

import { useState, useMemo } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  Settings,
} from "lucide-react";
import Button from "../ui/Button";
import AdvancedSearchModal, { SearchGroup } from "../ui/AdvancedSearchModal";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  searchable?: boolean;
  downloadable?: boolean;
  className?: string;
}

export default function DataTable({
  data,
  columns,
  title,
  searchable = true,
  downloadable = true,
  className = "",
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedSearchGroups, setAdvancedSearchGroups] = useState<
    SearchGroup[]
  >([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Apply advanced search filter
  const applyAdvancedSearch = (
    row: any,
    searchGroups: SearchGroup[]
  ): boolean => {
    if (searchGroups.length === 0) return true;

    return searchGroups.some((group) => {
      if (group.conditions.length === 0) return true;

      return group.conditions.every((condition) => {
        const value = row[condition.column];
        const searchValue = condition.value.toLowerCase();

        switch (condition.operator) {
          case "equals":
            return String(value).toLowerCase() === searchValue;
          case "not_equals":
            return String(value).toLowerCase() !== searchValue;
          case "contains":
            return String(value).toLowerCase().includes(searchValue);
          case "not_contains":
            return !String(value).toLowerCase().includes(searchValue);
          case "starts_with":
            return String(value).toLowerCase().startsWith(searchValue);
          case "ends_with":
            return String(value).toLowerCase().endsWith(searchValue);
          case "greater_than":
            return Number(value) > Number(searchValue);
          case "less_than":
            return Number(value) < Number(searchValue);
          case "greater_equal":
            return Number(value) >= Number(searchValue);
          case "less_equal":
            return Number(value) <= Number(searchValue);
          case "is_null":
            return value === null || value === undefined || value === "";
          case "is_not_null":
            return value !== null && value !== undefined && value !== "";
          default:
            return true;
        }
      });
    });
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply basic search filter
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        columns.some((col) => {
          const value = row[col.key];
          return value
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply advanced search filters
    if (advancedSearchGroups.length > 0) {
      filtered = filtered.filter((row) =>
        applyAdvancedSearch(row, advancedSearchGroups)
      );
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, advancedSearchGroups, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredAndSortedData.slice(
    startIndex,
    startIndex + pageSize
  );

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const handleDownload = () => {
    const csvContent = [
      columns.map((col) => col.label).join(","),
      ...filteredAndSortedData.map((row) =>
        columns.map((col) => `"${row[col.key] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "data"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`card rounded-2xl ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white border-opacity-10">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">
            {title || "Data Table"}
          </h3>
          <div className="flex items-center space-x-2">
            {downloadable && (
              <Button
                onClick={handleDownload}
                size="sm"
                variant="ghost"
                icon={<Download className="h-4 w-4" />}
              >
                Export
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      {searchable && (
        <div className="px-6 py-4 border-b border-white border-opacity-10">
          <div className="flex space-x-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white text-opacity-40" />
              <input
                type="text"
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 input text-sm"
              />
            </div>
            <Button
              onClick={() => setShowAdvancedSearch(true)}
              variant="outline"
              size="sm"
              icon={<Settings className="h-4 w-4" />}
            >
              Advanced
            </Button>
          </div>

          {/* Active Filters Display */}
          {advancedSearchGroups.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-white text-opacity-60">
                Active filters:
              </span>
              {advancedSearchGroups.map((group, groupIndex) =>
                group.conditions.map((condition, conditionIndex) => (
                  <span
                    key={`${group.id}-${condition.id}`}
                    className="px-2 py-1 bg-purple-500 bg-opacity-20 text-purple-400 rounded-full text-xs"
                  >
                    {condition.column} {condition.operator} {condition.value}
                  </span>
                ))
              )}
              <Button
                onClick={() => setAdvancedSearchGroups([])}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white border-opacity-10">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-white text-opacity-70 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer hover:text-white" : ""
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortColumn === column.key && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={`h-3 w-3 ${
                            sortDirection === "asc"
                              ? "text-white"
                              : "text-white text-opacity-40"
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 -mt-1 ${
                            sortDirection === "desc"
                              ? "text-white"
                              : "text-white text-opacity-40"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white divide-opacity-10">
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-white hover:bg-opacity-5 transition-colors duration-200"
              >
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                    {column.render ? (
                      column.render(row[column.key], row)
                    ) : (
                      <span className="text-sm text-white text-opacity-90">
                        {row[column.key] || "-"}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-white border-opacity-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-white text-opacity-70">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + pageSize, filteredAndSortedData.length)}{" "}
                of {filteredAndSortedData.length} results
              </span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="ml-4 input text-sm py-1 px-2"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                size="sm"
                variant="ghost"
              >
                Previous
              </Button>
              <span className="text-sm text-white text-opacity-70">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                size="sm"
                variant="ghost"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={() => setShowAdvancedSearch(false)}
        onSearch={setAdvancedSearchGroups}
        columns={columns}
      />
    </div>
  );
}
