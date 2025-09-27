"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project, DataSource } from "../../../../types";
import { clientDatabaseService } from "../../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../../lib/utils/ClientLogger";
import { DataWarehouseIntegrationService } from "../../../../lib/services/DataWarehouseIntegrationService";
import Button from "../../../../components/ui/Button";
import DataSourcesPanel from "../../../../components/projects/DataSourcesPanel";
import ImportTimeline from "../../../../components/projects/ImportTimeline";
import { ArrowLeft, Plus } from "lucide-react";

export default function DataSourcesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;
  const dataWarehouseIntegration =
    DataWarehouseIntegrationService.getInstance();

  const [project, setProject] = useState<Project | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const loadedProject = await dbService.getProject(projectId);
      if (loadedProject) {
        setProject(loadedProject);
        const loadedDataSources = await dbService.getDataSources(projectId);
        setDataSources(loadedDataSources);
      }
      setLoading(false);
    } catch (error) {
      clientLogger.error("Failed to load project", "database", {
        projectId,
        error,
      });
      setLoading(false);
    }
  };

  const handleDataSourceUpdated = async () => {
    await loadProject();
  };

  const handleRunDataSource = async (source: DataSource) => {
    try {
      clientLogger.info("Running data source", "data-processing", {
        sourceId: source.id,
      });

      // Update data source status to running
      await dbService.updateDataSource(projectId, source.id, {
        ...source,
        status: "running",
        lastSyncAt: new Date(),
      });

      // Reload data sources to show running status
      await loadProject();

      // Execute the actual data source import/reimport
      try {
        let importedData: any[] = [];
        let recordCount = 0;

        // Handle different data source types
        switch (source.type) {
          case "csv":
            // For file sources, we need to re-read the file
            if (source.config?.filePath) {
              // In a real implementation, this would read the file again
              // For now, we'll simulate with mock data
              importedData = [
                { id: 1, name: "Updated Data 1", value: "Reimported" },
                { id: 2, name: "Updated Data 2", value: "Reimported" },
                { id: 3, name: "Updated Data 3", value: "Reimported" },
              ];
              recordCount = importedData.length;
            }
            break;

          case "api_script":
            // For API sources, make a new API call
            if (source.config?.apiUrl) {
              // In a real implementation, this would make an API call
              // For now, we'll simulate with mock data
              importedData = [
                { id: 1, name: "API Data 1", value: "Fresh from API" },
                { id: 2, name: "API Data 2", value: "Fresh from API" },
              ];
              recordCount = importedData.length;
            }
            break;

          case "mysql":
            // For MySQL sources, query the database again
            // In a real implementation, this would connect to MySQL
            importedData = [
              { id: 1, name: "DB Record 1", value: "From MySQL" },
              { id: 2, name: "DB Record 2", value: "From MySQL" },
              { id: 3, name: "DB Record 3", value: "From MySQL" },
              { id: 4, name: "DB Record 4", value: "From MySQL" },
            ];
            recordCount = importedData.length;
            break;

          case "sql_dump":
            // For custom scripts, execute the script again
            // In a real implementation, this would run the script
            importedData = [
              { id: 1, name: "Script Output 1", value: "Generated" },
              { id: 2, name: "Script Output 2", value: "Generated" },
            ];
            recordCount = importedData.length;
            break;

          default:
            throw new Error(`Unsupported data source type: ${source.type}`);
        }

        // Create a new snapshot with the imported data
        const snapshot = {
          id: `snapshot_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          projectId,
          dataSourceId: source.id,
          data: importedData,
          recordCount,
          createdAt: new Date(),
          metadata: {
            columns:
              importedData.length > 0 ? Object.keys(importedData[0]).length : 0,
            sourceType: source.type,
            reimport: true,
          },
        };

        // Save the snapshot
        await dbService.createSnapshot(projectId, snapshot);

        // Update data source with new record count and status
        await dbService.updateDataSource(projectId, source.id, {
          ...source,
          status: "completed",
          lastSyncAt: new Date(),
          recordCount,
        });

        // Integrate with data warehouse services
        await dataWarehouseIntegration.onSnapshotCreated(
          snapshot,
          source,
          projectId
        );

        // Trigger Import Timeline refresh
        setTimelineRefreshTrigger((prev) => prev + 1);

        // Reload data sources
        await loadProject();

        clientLogger.success(
          "Data source reimported successfully",
          "data-processing",
          {
            sourceId: source.id,
            recordCount,
            snapshotId: snapshot.id,
          }
        );
      } catch (importError) {
        // Update data source status to error
        await dbService.updateDataSource(projectId, source.id, {
          ...source,
          status: "error",
          lastSyncAt: new Date(),
        });

        // Reload data sources
        await loadProject();

        clientLogger.error("Data source import failed", "data-processing", {
          error: importError,
          sourceId: source.id,
        });
      }
    } catch (error) {
      clientLogger.error("Failed to run data source", "data-processing", {
        error,
        sourceId: source.id,
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-white">Project not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Page Actions */}
      <div className="flex items-center justify-end mb-8 space-x-3">
        <Button
          onClick={() =>
            router.push(`/project/${projectId}/add-data-source-unified`)
          }
          variant="primary"
          icon={<Plus className="h-4 w-4" />}
        >
          Add Data Source
        </Button>
      </div>

      {/* Data Sources Panel */}
      <div className="mb-8">
        <DataSourcesPanel
          dataSources={dataSources}
          onAddSource={() =>
            router.push(`/project/${projectId}/add-data-source-unified`)
          }
          onRunSource={handleRunDataSource}
          onEditSource={(dataSource) => {
            // TODO: Implement edit functionality with unified workflow
            alert(
              "Edit functionality will be implemented with the unified workflow"
            );
          }}
          onDeleteSource={(dataSource) => {
            router.push(
              `/project/${projectId}/delete-data-source/${dataSource.id}`
            );
          }}
        />
      </div>

      {/* Import Timeline */}
      <div>
        <ImportTimeline
          refreshTrigger={timelineRefreshTrigger}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
