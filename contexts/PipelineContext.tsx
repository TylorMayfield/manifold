"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Pipeline, TransformStep } from '../types';
import { clientLogger } from '../lib/utils/ClientLogger';

interface PipelineContextType {
  pipelines: Pipeline[];
  loading: boolean;
  error: string | null;
  createPipeline: (pipelineData: { name: string; description?: string; steps?: TransformStep[]; inputSourceIds?: string[] }) => Promise<Pipeline>;
  updatePipeline: (id: string, updates: Partial<Pipeline>) => Promise<Pipeline | null>;
  deletePipeline: (id: string) => Promise<boolean>;
  getPipeline: (id: string) => Pipeline | null;
  refreshPipelines: () => Promise<void>;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export function usePipelines() {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipelines must be used within a PipelineProvider');
  }
  return context;
}

interface PipelineProviderProps {
  children: ReactNode;
}

export function PipelineProvider({ children }: PipelineProviderProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPipelines = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/pipelines?projectId=default');
      if (!response.ok) {
        throw new Error('Failed to fetch pipelines');
      }
      
      const data = await response.json();
      setPipelines(data);
      clientLogger.info('Pipelines loaded', 'data-transformation', { count: data.length });
    } catch (err) {
      clientLogger.error('Error fetching pipelines', 'data-transformation', { error: err });
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createPipeline = async (pipelineData: { name: string; description?: string; steps?: TransformStep[]; inputSourceIds?: string[] }): Promise<Pipeline> => {
    try {
      setError(null);
      
      const response = await fetch('/api/pipelines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: 'default',
          ...pipelineData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create pipeline');
      }

      const newPipeline = await response.json();
      setPipelines(prev => [newPipeline, ...prev]);
      clientLogger.success('Pipeline created', 'data-transformation', {
        pipelineId: newPipeline.id,
        pipelineName: newPipeline.name
      });
      return newPipeline;
    } catch (err) {
      clientLogger.error('Error creating pipeline', 'data-transformation', { error: err });
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updatePipeline = async (id: string, updates: Partial<Pipeline>): Promise<Pipeline | null> => {
    try {
      setError(null);
      
      const response = await fetch('/api/pipelines', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update pipeline');
      }

      const updatedPipeline = await response.json();
      setPipelines(prev => 
        prev.map(pipeline => 
          pipeline.id === id ? updatedPipeline : pipeline
        )
      );
      clientLogger.success('Pipeline updated', 'data-transformation', { pipelineId: id });
      return updatedPipeline;
    } catch (err) {
      clientLogger.error('Error updating pipeline', 'data-transformation', { error: err, pipelineId: id });
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    }
  };

  const deletePipeline = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/pipelines?pipelineId=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pipeline');
      }

      setPipelines(prev => prev.filter(pipeline => pipeline.id !== id));
      clientLogger.success('Pipeline deleted', 'data-transformation', { pipelineId: id });
      return true;
    } catch (err) {
      clientLogger.error('Error deleting pipeline', 'data-transformation', { error: err, pipelineId: id });
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    }
  };

  const getPipeline = (id: string): Pipeline | null => {
    return pipelines.find(pipeline => pipeline.id === id) || null;
  };

  // Load pipelines on mount
  useEffect(() => {
    refreshPipelines();
  }, []);

  const contextValue: PipelineContextType = {
    pipelines,
    loading,
    error,
    createPipeline,
    updatePipeline,
    deletePipeline,
    getPipeline,
    refreshPipelines,
  };

  return (
    <PipelineContext.Provider value={contextValue}>
      {children}
    </PipelineContext.Provider>
  );
}