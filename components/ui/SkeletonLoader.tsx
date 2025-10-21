import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'table' | 'text' | 'circle';
  count?: number;
  className?: string;
}

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 border-2 border-gray-300 rounded ${className}`}>
    <div className="p-6 space-y-4">
      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number; className?: string }> = ({ 
  count = 3, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200 border-2 border-gray-300 rounded p-4">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-300 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ 
  rows = 5, 
  cols = 4,
  className = '' 
}) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4 bg-gray-200 border-2 border-gray-300 p-4 rounded">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-300 rounded flex-1"></div>
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <div key={rowIdx} className="flex space-x-4 bg-gray-100 border border-gray-300 p-4 rounded">
        {Array.from({ length: cols }).map((_, colIdx) => (
          <div key={colIdx} className="h-3 bg-gray-300 rounded flex-1"></div>
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <div className={`animate-pulse space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div 
        key={i} 
        className="h-4 bg-gray-300 rounded" 
        style={{ width: i === lines - 1 ? '60%' : '100%' }}
      ></div>
    ))}
  </div>
);

export const SkeletonCircle: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };
  
  return (
    <div className={`animate-pulse bg-gray-300 rounded-full ${sizeClasses[size]} ${className}`}></div>
  );
};

export const SkeletonDataSourceCard: React.FC = () => (
  <div className="animate-pulse bg-white border-2 border-gray-300 rounded-lg p-6 hover:shadow-cell transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 bg-gray-300 rounded"></div>
        <div className="space-y-2">
          <div className="h-5 bg-gray-300 rounded w-32"></div>
          <div className="h-3 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
      <div className="h-8 w-20 bg-gray-300 rounded"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-3 bg-gray-300 rounded w-full"></div>
      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
    </div>
    <div className="flex items-center justify-between">
      <div className="h-3 bg-gray-300 rounded w-32"></div>
      <div className="flex space-x-2">
        <div className="h-8 w-8 bg-gray-300 rounded"></div>
        <div className="h-8 w-8 bg-gray-300 rounded"></div>
        <div className="h-8 w-8 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

export const SkeletonPipelineCard: React.FC = () => (
  <div className="animate-pulse bg-white border-2 border-gray-300 rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <div className="space-y-2 flex-1">
        <div className="h-5 bg-gray-300 rounded w-48"></div>
        <div className="h-3 bg-gray-300 rounded w-64"></div>
      </div>
      <div className="h-6 w-16 bg-gray-300 rounded-full"></div>
    </div>
    <div className="grid grid-cols-3 gap-4 mt-4">
      <div>
        <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-12"></div>
      </div>
      <div>
        <div className="h-3 bg-gray-300 rounded w-16 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-12"></div>
      </div>
      <div>
        <div className="h-3 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-32"></div>
      </div>
    </div>
  </div>
);

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
  variant = 'card', 
  count = 3,
  className = ''
}) => {
  switch (variant) {
    case 'card':
      return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
          {Array.from({ length: count }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      );
    case 'list':
      return <SkeletonList count={count} className={className} />;
    case 'table':
      return <SkeletonTable rows={count} className={className} />;
    case 'text':
      return <SkeletonText lines={count} className={className} />;
    case 'circle':
      return <SkeletonCircle className={className} />;
    default:
      return null;
  }
};

export default SkeletonLoader;
