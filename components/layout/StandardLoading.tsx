"use client";

import React from "react";
import { LoadingState } from "../ui";

export interface StandardLoadingProps {
  message?: string;
  submessage?: string;
}

/**
 * StandardLoading Component
 *
 * Standard full-page loading for route transitions.
 * Use this for ALL loading.tsx files for consistency across the application.
 *
 * Design matches error pages with gradient-bg and consistent styling.
 *
 * Usage in app/loading.tsx:
 *   "use client";
 *   import StandardLoading from '@/components/layout/StandardLoading';
 *   export default function Loading() {
 *     return <StandardLoading
 *       message="Loading..."
 *       submessage="Please wait while we load your data"
 *     />;
 *   }
 *
 * @param message - Main loading message (e.g., "Loading Project...")
 * @param submessage - Optional secondary message for context
 */
const StandardLoading: React.FC<StandardLoadingProps> = ({
  message = "Loading...",
  submessage = "Please wait while we load your data",
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
