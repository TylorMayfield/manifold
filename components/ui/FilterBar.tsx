"use client"

import React from "react";
import { Filter, X } from "lucide-react";
import CellButton from "./CellButton";
import { cn } from "../../lib/utils/cn";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<any>;
}

interface FilterBarProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  showClearButton?: boolean;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  options,
  value,
  onChange,
  label = "Filter",
  showClearButton = true,
  className,
}) => {
  const handleClear = () => {
    onChange("all");
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {label && (
        <div className="flex items-center gap-2 text-sm text-white/70">
          <Filter className="w-4 h-4" />
          <span>{label}:</span>
        </div>
      )}
      
      <div className="flex gap-2 flex-wrap">
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = value === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                "border-2 border-black",
                isActive
                  ? "bg-tangerine-400 text-black shadow-cell-sm"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                <span>{option.label}</span>
                {option.count !== undefined && (
                  <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded text-xs",
                    isActive ? "bg-black/20" : "bg-white/20"
                  )}>
                    {option.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {showClearButton && value !== "all" && (
        <CellButton
          variant="ghost"
          size="sm"
          onClick={handleClear}
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </CellButton>
      )}
    </div>
  );
};

export default FilterBar;
