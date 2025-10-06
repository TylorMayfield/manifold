import { useState, useCallback } from 'react';

interface UseProgressOptions {
  onComplete?: () => void;
  autoIncrement?: boolean;
  incrementInterval?: number;
}

export function useProgress(options: UseProgressOptions = {}) {
  const { onComplete, autoIncrement = false, incrementInterval = 500 } = options;
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(() => {
    setProgress(0);
    setIsActive(true);
  }, []);

  const update = useCallback((value: number) => {
    setProgress(Math.min(Math.max(value, 0), 100));
    if (value >= 100) {
      setIsActive(false);
      onComplete?.();
    }
  }, [onComplete]);

  const increment = useCallback((amount: number = 5) => {
    setProgress((prev) => {
      const newProgress = Math.min(prev + amount, 100);
      if (newProgress >= 100) {
        setIsActive(false);
        onComplete?.();
      }
      return newProgress;
    });
  }, [onComplete]);

  const complete = useCallback(() => {
    setProgress(100);
    setIsActive(false);
    onComplete?.();
  }, [onComplete]);

  const reset = useCallback(() => {
    setProgress(0);
    setIsActive(false);
  }, []);

  return {
    progress,
    isActive,
    start,
    update,
    increment,
    complete,
    reset,
  };
}

/**
 * Hook for tracking multi-step operations
 */
export function useStepProgress(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  const progress = ((currentStep + stepProgress / 100) / totalSteps) * 100;

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    setStepProgress(0);
  }, [totalSteps]);

  const updateStepProgress = useCallback((value: number) => {
    setStepProgress(Math.min(Math.max(value, 0), 100));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setStepProgress(0);
  }, []);

  const complete = useCallback(() => {
    setCurrentStep(totalSteps);
    setStepProgress(100);
  }, [totalSteps]);

  return {
    progress,
    currentStep,
    stepProgress,
    nextStep,
    updateStepProgress,
    reset,
    complete,
  };
}

/**
 * Hook for tracking file upload progress
 */
export function useUploadProgress() {
  const [uploads, setUploads] = useState<Map<string, number>>(new Map());

  const updateUpload = useCallback((id: string, progress: number) => {
    setUploads((prev) => new Map(prev).set(id, progress));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setUploads(new Map());
  }, []);

  const totalProgress = uploads.size > 0
    ? Array.from(uploads.values()).reduce((sum, p) => sum + p, 0) / uploads.size
    : 0;

  return {
    uploads,
    totalProgress,
    updateUpload,
    removeUpload,
    clearAll,
  };
}

