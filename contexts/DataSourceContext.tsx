"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { DataProvider, Snapshot } from "../types";
import { generateMockData } from "../lib/utils/mockDataGenerator";

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
          console.warn("Failed to initialize default project:", error);
        }

        // Load data sources
        try {
          const sourcesResponse = await fetch(
            "/api/data-sources?projectId=default"
          );
          if (sourcesResponse.ok) {
            const sourcesData = await sourcesResponse.json();
            setDataSources(sourcesData);
          } else {
            console.warn(
              "Failed to load data sources:",
              sourcesResponse.status
            );
          }
        } catch (error) {
          console.warn("Failed to load data sources:", error);
        }

        // Load snapshots
        try {
          const snapshotsResponse = await fetch(
            "/api/snapshots?projectId=default"
          );
          if (snapshotsResponse.ok) {
            const snapshotsData = await snapshotsResponse.json();
            setSnapshots(snapshotsData);
          } else {
            console.warn("Failed to load snapshots:", snapshotsResponse.status);
          }
        } catch (error) {
          console.warn("Failed to load snapshots:", error);
        }
      } catch (error) {
        console.error("Failed to load data from API:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const addDataSource = async (source: DataProvider) => {
    try {
      console.log('[DataSourceContext] Creating data source:', source);
      
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
        console.log('[DataSourceContext] Data source created successfully:', newSource);
      } else {
        const errorText = await response.text();
        console.error("API Error creating data source:", response.status, errorText);
        
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

      // If this is a mock data source, generate mock data and create a snapshot
      if (source.type === "mock" && source.config?.mockConfig) {
        try {
          const { templateId, recordCount } = source.config.mockConfig;
          console.log('[DataSourceContext] Generating mock data with:', { templateId, recordCount });
          const mockSnapshot = generateMockData(templateId, recordCount);
          console.log('[DataSourceContext] Mock data generated:', mockSnapshot);

          // Create snapshot with the data source ID
          const snapshot: Snapshot = {
            ...mockSnapshot,
            dataSourceId: newSource.id,
            projectId: source.projectId,
            createdAt: new Date(),
          };

          // Add snapshot via API or locally
          try {
            console.log('[DataSourceContext] Sending snapshot to API with data length:', mockSnapshot.data?.length);
            const snapshotResponse = await fetch("/api/snapshots", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId: source.projectId,
                dataSourceId: newSource.id,
                data: mockSnapshot.data,
                schema: mockSnapshot.schema,
                metadata: mockSnapshot.metadata
              }),
            });

            if (snapshotResponse.ok) {
              const createdSnapshot = await snapshotResponse.json();
              console.log('[DataSourceContext] Snapshot created successfully:', createdSnapshot);
              setSnapshots((prev) => [...prev, snapshot]);
            } else {
              const errorText = await snapshotResponse.text();
              console.warn("Failed to create snapshot via API:", errorText);
              setSnapshots((prev) => [...prev, snapshot]);
            }
          } catch (error) {
            console.warn(
              "Error creating snapshot via API, adding locally:",
              error
            );
            setSnapshots((prev) => [...prev, snapshot]);
          }
        } catch (error) {
          console.error("Failed to generate mock data:", error);
        }
      }

      return newSource;
    } catch (error) {
      console.warn("Error adding data source via API, adding locally:", error);
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
      console.error("Error updating data source:", error);
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
      } else {
        throw new Error("Failed to delete data source");
      }
    } catch (error) {
      console.error("Error deleting data source:", error);
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
        return newSnapshot;
      } else {
        console.warn("Failed to create snapshot via API, adding locally");
        // Fallback: add locally if API fails
        const localSnapshot = {
          ...snapshot,
          id: snapshot.id || `snapshot_${Date.now()}`,
        };
        setSnapshots((prev) => [...prev, localSnapshot]);
        return localSnapshot;
      }
    } catch (error) {
      console.warn("Error adding snapshot via API, adding locally:", error);
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
