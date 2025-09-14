"use client";

import React from "react";
import { useViewTransition } from "../../hooks/useViewTransition";
import LoadingOverlay from "../ui/LoadingOverlay";

interface TransitionProviderProps {
  children: React.ReactNode;
}

export default function TransitionProvider({
  children,
}: TransitionProviderProps) {
  const { isLoading, loadingType } = useViewTransition();

  return (
    <>
      {children}
      <LoadingOverlay isVisible={isLoading} type={loadingType} />
    </>
  );
}
