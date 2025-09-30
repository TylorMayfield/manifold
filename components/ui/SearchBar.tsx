"use client"

import React from 'react';
import { Search, X } from 'lucide-react';
import CellInput from './CellInput';
import { cn } from '../../lib/utils/cn';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
  autoFocus?: boolean;
}

/**
 * SearchBar Component
 * 
 * Consistent search input with clear button.
 * 
 * Usage:
 *   <SearchBar 
 *     value={searchTerm}
 *     onChange={setSearchTerm}
 *     placeholder="Search jobs..."
 *   />
 */
const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className,
  autoFocus = false
}) => {
  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search className="w-4 h-4 text-white/50" />
      </div>
      
      <CellInput
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
        autoFocus={autoFocus}
      />
      
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4 text-white/70 hover:text-white" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
