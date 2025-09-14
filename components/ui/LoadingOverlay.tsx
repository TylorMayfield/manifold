"use client";

import React from "react";

interface LoadingOverlayProps {
  isVisible: boolean;
  type?: string;
}

export default function LoadingOverlay({
  isVisible,
  type = "blur",
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  const getLoadingIcon = () => {
    switch (type) {
      case "blur":
        return "◐";
      case "fade":
        return "↻";
      case "zoom":
        return "⧗";
      default:
        return "◐";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="glass-button-primary p-6 rounded-2xl flex flex-col items-center space-y-4">
        <div className="text-4xl animate-pulse">{getLoadingIcon()}</div>
        <div className="text-white/80 text-sm">Loading...</div>
      </div>
    </div>
  );
}
