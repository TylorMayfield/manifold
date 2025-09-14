"use client";

import { useCallback, useState } from "react";

interface ViewTransitionOptions {
  type?: "blur" | "fade" | "zoom";
  duration?: number;
  easing?: string;
  name?: string; // For named view transitions
  showLoading?: boolean; // Whether to show loading overlay
}

export const useViewTransition = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<string>("blur");

  // Apply transition class to document based on type
  const applyTransitionClass = useCallback((type: string) => {
    // Remove existing transition classes
    document.documentElement.classList.remove("slide-right", "fade", "zoom");

    if (type !== "blur") {
      document.documentElement.classList.add(type);
    }
  }, []);

  // Clean up transition classes after animation
  const cleanupTransitionClass = useCallback(() => {
    document.documentElement.classList.remove("slide-right", "fade", "zoom");
  }, []);

  const navigateWithTransition = useCallback(
    async (url: string, options: ViewTransitionOptions = {}): Promise<void> => {
      const {
        type = "blur",
        duration = 250, // Slightly longer for blur effect
        easing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Smooth easing
        name,
        showLoading = true,
      } = options;

      // Show loading overlay immediately if enabled
      if (showLoading) {
        setLoadingType(type);
        setIsLoading(true);
      }

      // Check if View Transitions API is supported
      if (!document.startViewTransition) {
        // Fallback to regular navigation with loading
        if (showLoading) {
          // Show loading for a brief moment before navigation
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        setIsLoading(false);
        window.location.href = url;
        return;
      }

      try {
        // Apply transition class
        applyTransitionClass(type);

        // Start the view transition
        const transition = document.startViewTransition(async () => {
          // Apply transition styles
          document.documentElement.style.setProperty(
            "--view-transition-duration",
            `${duration}ms`
          );
          document.documentElement.style.setProperty(
            "--view-transition-timing-function",
            easing
          );

          // Navigate to the new page
          window.location.href = url;
        });

        // Wait for transition to complete and clean up
        await transition.finished;
        cleanupTransitionClass();
        setIsLoading(false);
      } catch (error) {
        console.error("View transition failed:", error);
        cleanupTransitionClass();
        setIsLoading(false);
        // Fallback to regular navigation
        window.location.href = url;
      }
    },
    [applyTransitionClass, cleanupTransitionClass]
  );

  const goBackWithTransition = useCallback(
    async (options: ViewTransitionOptions = {}): Promise<void> => {
      const {
        type = "blur",
        duration = 250, // Slightly longer for blur effect
        easing = "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Smooth easing
        name,
        showLoading = true,
      } = options;

      // Show loading overlay immediately if enabled
      if (showLoading) {
        setLoadingType(type);
        setIsLoading(true);
      }

      // Check if View Transitions API is supported
      if (!document.startViewTransition) {
        // Fallback to regular navigation with loading
        if (showLoading) {
          // Show loading for a brief moment before navigation
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
        setIsLoading(false);
        window.history.back();
        return;
      }

      try {
        // Apply transition class
        applyTransitionClass(type);

        // Start the view transition
        const transition = document.startViewTransition(async () => {
          // Apply transition styles
          document.documentElement.style.setProperty(
            "--view-transition-duration",
            `${duration}ms`
          );
          document.documentElement.style.setProperty(
            "--view-transition-timing-function",
            easing
          );

          // Go back
          window.history.back();
        });

        // Wait for transition to complete and clean up
        await transition.finished;
        cleanupTransitionClass();
        setIsLoading(false);
      } catch (error) {
        console.error("View transition failed:", error);
        cleanupTransitionClass();
        setIsLoading(false);
        // Fallback to regular navigation
        window.history.back();
      }
    },
    [applyTransitionClass, cleanupTransitionClass]
  );

  // Enhanced transition for specific elements (like project cards)
  const transitionElement = useCallback(
    async (
      element: HTMLElement,
      callback: () => void,
      options: ViewTransitionOptions = {}
    ): Promise<void> => {
      const {
        type = "zoom",
        duration = 300,
        easing = "cubic-bezier(0.4, 0, 0.2, 1)",
        name = "project-card",
      } = options;

      // Check if View Transitions API is supported
      if (!document.startViewTransition) {
        callback();
        return;
      }

      try {
        // Apply transition class
        applyTransitionClass(type);

        // Start the view transition
        const transition = document.startViewTransition(callback);

        // Wait for transition to complete and clean up
        await transition.finished;
        cleanupTransitionClass();
      } catch (error) {
        console.error("Element view transition failed:", error);
        cleanupTransitionClass();
        callback();
      }
    },
    [applyTransitionClass, cleanupTransitionClass]
  );

  return {
    navigateWithTransition,
    goBackWithTransition,
    transitionElement,
    isLoading,
    loadingType,
  };
};

export default useViewTransition;
