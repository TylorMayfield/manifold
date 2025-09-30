"use client"

import React from 'react';
import { LoadingState } from '../ui';

export interface StandardLoadingProps {
  message?: string;
  submessage?: string;
}

/**
 * StandardLoading Component
 * 
 * Standard full-page loading for route transitions.
 * Use this for all loading.tsx files for consistency.
 * 
 * Usage in app/loading.tsx:
 *   import StandardLoading from '@/components/layout/StandardLoading';
 *   export default function Loading() {
 *     return <StandardLoading message="Loading application..." />;
 *   }
 */
const StandardLoading: React.FC<StandardLoadingProps> = ({
  message = "Loading...",
  submessage = "Please wait while we load your data"
}) => {
  return (
    <LoadingState
      variant="page"
      size="lg"
      message={message}
      submessage={submessage}
    />
  );
};

export default StandardLoading;
