"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DataProvider, Snapshot } from "../types";
import { clientLogger } from "../lib/utils/ClientLogger";

interface DataSourceContextType {
  dataSources: DataProvider[];
  snapshots: Snapshot[];
  addDataSource: (source: DataProvider) => Promise<DataProvider>;
  updateDataSource: (
    id: string,
    updates: Partial<DataProvider>
  ) => Promise<void>;
  removeDataSource: (id: string) => Promise<void>;
  addSnapshot: (snapshot: Snapshot) => Promise<Snapshot>;
  getDataSourceSnapshots: (sourceId: string) => Snapshot[];
  loading: boolean;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(
  undefined
);

export function useDataSources() {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error("useDataSources must be used within a DataSourceProvider");
  }
  return context;
}

interface DataSourceProviderProps {
  children: React.ReactNode;
}

export function DataSourceProvider({ children }: DataSourceProviderProps) {
  const [dataSources, setDataSources] = useState<DataProvider[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Initialize default project first
        try {
          await fetch("/api/projects", { method: "PATCH" });
        } catch (error) {
          clientLogger.warn("Failed to initialize default project", "system", { error });
        }

        // Load data sources
        try {
          const sourcesResponse = await fetch(
            "/api/data-sources?projectId=default"
          );
          if (sourcesResponse.ok) {
            const sourcesData = await sourcesResponse.json();
            setDataSources(sourcesData);
            clientLogger.info("Data sources loaded", "data-processing", { 
              count: sourcesData.length 
            });
          } else {
            clientLogger.warn("Failed to load data sources", "api", { 
              httpStatus: sourcesResponse.status 
            });
          }
        } catch (error) {
          clientLogger.error("Error loading data sources", "api", { error });
        }

        // Load snapshots
        try {
          const snapshotsResponse = await fetch(
            "/api/snapshots?projectId=default"
          );
          if (snapshotsResponse.ok) {
            const snapshotsData = await snapshotsResponse.json();
            setSnapshots(snapshotsData);
            clientLogger.info("Snapshots loaded", "data-processing", { 
              count: snapshotsData.length 
            });
          } else {
            clientLogger.warn("Failed to load snapshots", "api", { 
              httpStatus: snapshotsResponse.status 
            });
          }
        } catch (error) {
          clientLogger.error("Error loading snapshots", "api", { error });
        }
      } catch (error) {
        clientLogger.error("Failed to load data from API", "system", { error });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const addDataSource = async (source: DataProvider) => {
    try {
      clientLogger.info('Creating data source', 'data-processing', {
        sourceName: source.name,
        sourceType: source.type
      });
      
      const response = await fetch("/api/data-sources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...source, projectId: "default" }),
      });

      let newSource: DataProvider;
      if (response.ok) {
        newSource = await response.json();
        clientLogger.success('Data source created successfully', 'data-processing', {
          sourceId: newSource.id,
          sourceName: newSource.name
        });
      } else {
        const errorText = await response.text();
        clientLogger.error('Data source creation failed', 'api', {
          httpStatus: response.status,
          error: errorText
        });
        
        // Try to parse error
        try {
          const errorJson = JSON.parse(errorText);
          alert(`Failed to create data source: ${errorJson.error || errorJson.message || 'Unknown error'}`);
        } catch {
          alert(`Failed to create data source: ${errorText || response.statusText}`);
        }
        
        throw new Error(`API returned ${response.status}`);
      }

      setDataSources((prev) => [...prev, newSource]);

      // Auto-generate a disabled pipeline for this data source
      try {
        const pipelineName = `Import - ${newSource.name}`;
        const pipelineDescription = `Auto-generated pipeline for data source ${newSource.name}. Configure steps, then enable.`;
        const pipelineResponse = await fetch('/api/pipelines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: 'default',
            name: pipelineName,
            description: pipelineDescription,
            steps: [],
            inputSourceIds: [newSource.id],
            enabled: false,
            config: { createdBy: 'auto', template: 'ingest-only' }
          })
        });

        if (pipelineResponse.ok) {
          const createdPipeline = await pipelineResponse.json();
          clientLogger.success('Disabled pipeline auto-created for data source', 'data-transformation', {
            pipelineId: createdPipeline.id,
            pipelineName,
            dataSourceId: newSource.id
          });

          // Auto-generate a disabled job template linked to the pipeline
          try {
            const jobName = `Schedule - ${newSource.name}`;
            const jobResponse = await fetch('/api/jobs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                projectId: 'default',
                name: jobName,
                type: 'data_sync',
                pipelineId: createdPipeline.id,
                dataSourceId: newSource.id,
                schedule: '0 2 * * *', // Daily at 2 AM (disabled by default)
                enabled: false
              })
            });

            if (jobResponse.ok) {
              const createdJob = await jobResponse.json();
              clientLogger.success('Disabled job template auto-created for data source', 'jobs', {
                jobId: createdJob.id,
                pipelineId: createdPipeline.id,
                dataSourceId: newSource.id
              });
            } else {
              const jobErr = await jobResponse.text();
              clientLogger.warn('Failed to auto-create job template', 'jobs', {
                httpStatus: jobResponse.status,
                error: jobErr,
                pipelineId: createdPipeline.id
              });
            }
          } catch (jobError) {
            clientLogger.warn('Error while auto-creating job template for pipeline', 'jobs', { error: jobError, dataSourceId: newSource.id });
          }
        } else {
          const errText = await pipelineResponse.text();
          clientLogger.warn('Failed to auto-create pipeline for data source', 'data-transformation', {
            httpStatus: pipelineResponse.status,
            error: errText,
            dataSourceId: newSource.id
          });
        }
      } catch (err) {
        clientLogger.warn('Error while auto-creating pipeline for data source', 'data-transformation', { error: err, dataSourceId: newSource.id });
      }

      return newSource;
    } catch (error) {
      clientLogger.error("Error adding data source, falling back to local", "data-processing", { error });
      // Fallback: add locally if API fails
      const localSource = {
        ...source,
        id: source.id || `source_${Date.now()}`,
      };
      setDataSources((prev) => [...prev, localSource]);
      return localSource;
    }
  };

  const updateDataSource = async (
    id: string,
    updates: Partial<DataProvider>
  ) => {
    try {
      const response = await fetch("/api/data-sources", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "default",
          dataSourceId: id,
          ...updates,
        }),
      });

      if (response.ok) {
        setDataSources((prev) =>
          prev.map((source) =>
            source.id === id
              ? { ...source, ...updates, updatedAt: new Date() }
              : source
          )
        );
      } else {
        throw new Error("Failed to update data source");
      }
    } catch (error) {
      clientLogger.error("Error updating data source", "data-processing", { error, dataSourceId: id });
      throw error;
    }
  };

  const removeDataSource = async (id: string) => {
    try {
      const response = await fetch(
        `/api/data-sources?projectId=default&dataSourceId=${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setDataSources((prev) => prev.filter((source) => source.id !== id));
        // Also remove associated snapshots
        setSnapshots((prev) =>
          prev.filter((snapshot) => snapshot.dataSourceId !== id)
        );
        clientLogger.success("Data source deleted", "data-processing", { dataSourceId: id });
      } else {
        throw new Error("Failed to delete data source");
      }
    } catch (error) {
      clientLogger.error("Error deleting data source", "data-processing", { error, dataSourceId: id });
      throw error;
    }
  };

  const addSnapshot = async (snapshot: Snapshot) => {
    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId: "default", ...snapshot }),
      });

      if (response.ok) {
        const newSnapshot = await response.json();
        setSnapshots((prev) => [...prev, newSnapshot]);
        clientLogger.success("Snapshot created", "data-processing", {
          snapshotId: newSnapshot.id,
          dataSourceId: snapshot.dataSourceId
        });
        return newSnapshot;
      } else {
        clientLogger.warn("Snapshot API failed, adding locally", "data-processing", {
          httpStatus: response.status
        });
        // Fallback: add locally if API fails
        const localSnapshot = {
          ...snapshot,
          id: snapshot.id || `snapshot_${Date.now()}`,
        };
        setSnapshots((prev) => [...prev, localSnapshot]);
        return localSnapshot;
      }
    } catch (error) {
      clientLogger.warn("Error creating snapshot, adding locally", "data-processing", { error });
      // Fallback: add locally if API fails
      const localSnapshot = {
        ...snapshot,
        id: snapshot.id || `snapshot_${Date.now()}`,
      };
      setSnapshots((prev) => [...prev, localSnapshot]);
      return localSnapshot;
    }
  };

  const getDataSourceSnapshots = (sourceId: string) => {
    return snapshots.filter((snapshot) => snapshot.dataSourceId === sourceId);
  };

  return (
    <DataSourceContext.Provider
      value={{
        dataSources,
        snapshots,
        addDataSource,
        updateDataSource,
        removeDataSource,
        addSnapshot,
        getDataSourceSnapshots,
        loading,
      }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}
