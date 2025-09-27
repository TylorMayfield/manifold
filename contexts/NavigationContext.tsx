"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type NavigationPage =
  | "projects"
  | "job-monitor"
  | "job-manager"
  | "log-viewer"
  | "settings"
  | "backup-restore";

export interface NavigationState {
  currentPage: NavigationPage;
  previousPage: NavigationPage | null;
  pageHistory: NavigationPage[];
}

export interface NavigationContextType {
  navigationState: NavigationState;
  navigateTo: (page: NavigationPage) => void;
  navigateBack: () => void;
  canGoBack: boolean;
  isActive: (page: NavigationPage) => boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  initialPage?: NavigationPage;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialPage = "projects",
}) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPage: initialPage,
    previousPage: null,
    pageHistory: [initialPage],
  });

  const navigateTo = useCallback((page: NavigationPage) => {
    setNavigationState((prev) => ({
      currentPage: page,
      previousPage: prev.currentPage,
      pageHistory: [...prev.pageHistory, page],
    }));
  }, []);

  const navigateBack = useCallback(() => {
    setNavigationState((prev) => {
      if (prev.pageHistory.length <= 1) {
        return prev;
      }

      const newHistory = [...prev.pageHistory];
      newHistory.pop(); // Remove current page
      const previousPage = newHistory[newHistory.length - 1];

      return {
        currentPage: previousPage,
        previousPage: prev.currentPage,
        pageHistory: newHistory,
      };
    });
  }, []);

  const canGoBack = navigationState.pageHistory.length > 1;

  const isActive = useCallback(
    (page: NavigationPage) => {
      return navigationState.currentPage === page;
    },
    [navigationState.currentPage]
  );

  const value: NavigationContextType = {
    navigationState,
    navigateTo,
    navigateBack,
    canGoBack,
    isActive,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
