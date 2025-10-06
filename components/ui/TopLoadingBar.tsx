"use client";

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * TopLoadingBar - Global loading indicator at the top of the page
 * Automatically shows during route transitions
 */
export default function TopLoadingBar() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start loading on route change
    setLoading(true);
    setProgress(20);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    // Complete after a short delay
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out shadow-lg"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/**
 * Manual loading bar for custom operations
 */
export function ManualTopLoadingBar({
  isLoading,
  progress,
}: {
  isLoading: boolean;
  progress?: number;
}) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      if (progress !== undefined) {
        setDisplayProgress(progress);
      } else {
        // Auto-increment if no progress provided
        const interval = setInterval(() => {
          setDisplayProgress((prev) => (prev >= 90 ? 90 : prev + Math.random() * 10));
        }, 300);
        return () => clearInterval(interval);
      }
    } else {
      setDisplayProgress(100);
      setTimeout(() => setDisplayProgress(0), 300);
    }
  }, [isLoading, progress]);

  if (!isLoading && displayProgress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 ease-out"
        style={{ width: `${displayProgress}%` }}
      />
    </div>
  );
}

