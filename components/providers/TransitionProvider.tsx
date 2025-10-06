"use client";

import React from "react";
import { useViewTransition } from "../../hooks/useViewTransition";

interface TransitionProviderProps {
  children: React.ReactNode;
}

export default function TransitionProvider({
  children,
}: TransitionProviderProps) {
  const { isLoading, loadingType } = useViewTransition();

  return <>{children}</>;
}
