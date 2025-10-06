"use client";

import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import ProgressBar from './ProgressBar';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  blur?: boolean;
  children: React.ReactNode;
}

/**
 * LoadingOverlay - Wraps content with an optional loading overlay
 */
export default function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  progress,
  showProgress = false,
  blur = true,
  children,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 backdrop-blur-sm z-10 rounded-lg">
          <div className="flex flex-col items-center p-6">
            <LoadingSpinner size="lg" />
            {message && (
              <p className="mt-4 text-sm font-medium text-gray-700 animate-pulse">
                {message}
              </p>
            )}
            {showProgress && progress !== undefined && (
              <div className="mt-4 w-64">
                <ProgressBar 
                  progress={progress} 
                  showPercentage={true}
                  animated={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Full-screen loading overlay
 */
export function FullScreenLoadingOverlay({
  isLoading,
  message = 'Processing...',
  progress,
  showProgress = false,
}: {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
}) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          {message && (
            <p className="mt-4 text-lg font-medium text-gray-900 text-center">
              {message}
            </p>
          )}
          {showProgress && progress !== undefined && (
            <div className="mt-6 w-full">
              <ProgressBar 
                progress={progress} 
                showPercentage={true}
                animated={true}
                size="lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
