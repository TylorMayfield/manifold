"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project, DataSource, DataSourceType } from "../../../../types";
import { clientDatabaseService } from "../../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../../lib/utils/ClientLogger";
import { DataWarehouseIntegrationService } from "../../../../lib/services/DataWarehouseIntegrationService";
import Button from "../../../../components/ui/Button";
import FileUpload from "../../../../components/data-sources/FileUpload";
import SqlDumpUpload from "../../../../components/data-sources/SqlDumpUpload";
import MySqlConnection from "../../../../components/data-sources/MySqlConnection";
import CustomScriptEditor from "../../../../components/data-sources/CustomScriptEditor";
import ApiConnection from "../../../../components/data-sources/ApiConnection";
import MockDataProviderComponent from "../../../../components/providers/MockDataProvider";
import { SnapshotUtils } from "../../../../lib/utils/snapshotUtils";
import PageLayout from "../../../../components/layout/PageLayout";
import {
  ArrowLeft,
  Database,
  FileText,
  Code,
  Globe,
  Cloud,
} from "lucide-react";

export default function AddDataSourcePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;
  const dataWarehouseIntegration =
    DataWarehouseIntegrationService.getInstance();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [importType, setImportType] = useState<DataSourceType>("csv");

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const loadedProject = await dbService.getProject(projectId);
      if (loadedProject) {
        setProject(loadedProject);
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

  const handleDataSourceCreated = async (dataSource: DataSource) => {
    try {
      // Save the data source to the database
      await dbService.createDataSource(projectId, dataSource);

      // Integrate with data warehouse services
      await dataWarehouseIntegration.onDataSourceCreated(dataSource, projectId);

      // Create a snapshot for the import history
      try {
        const snapshot = await SnapshotUtils.createSnapshotFromMockData(
          dataSource,
          projectId
        );
        clientLogger.info(
          "Snapshot created for data source",
          "data-processing",
          {
            dataSourceId: dataSource.id,
            dataSourceName: dataSource.name,
          }
        );

        // Integrate snapshot with data warehouse services
        await dataWarehouseIntegration.onSnapshotCreated(
          snapshot,
          dataSource,
          projectId
        );
      } catch (snapshotError) {
        clientLogger.warn(
          "Failed to create snapshot for data source",
          "data-processing",
          {
            error: snapshotError,
            dataSourceId: dataSource.id,
          }
        );
      }

      clientLogger.success("Data source created and saved", "data-processing", {
        dataSourceId: dataSource.id,
        dataSourceName: dataSource.name,
      });

      // Navigate back to data sources page
      router.push(`/project/${projectId}/data-sources`);
    } catch (error) {
      clientLogger.error("Failed to save data source", "data-processing", {
        error: error instanceof Error ? error.message : error,
        dataSourceId: dataSource.id,
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

  const dataSourceTypes = [
    {
      type: "csv" as DataSourceType,
      name: "File Upload",
      description: "Upload CSV, JSON, or other data files",
      icon: <FileText className="h-6 w-6" />,
      color: "tangerine",
    },
    {
      type: "mysql" as DataSourceType,
      name: "MySQL Database",
      description: "Connect to a MySQL database",
      icon: <Database className="h-6 w-6" />,
      color: "apricot",
    },
    {
      type: "api_script" as DataSourceType,
      name: "API Endpoint",
      description: "Connect to REST API endpoints",
      icon: <Globe className="h-6 w-6" />,
      color: "jasper",
    },
    {
      type: "sql_dump" as DataSourceType,
      name: "Custom Script",
      description: "Create custom data processing scripts",
      icon: <Code className="h-6 w-6" />,
      color: "dark_cyan",
    },
    {
      type: "mock" as DataSourceType,
      name: "Mock Data",
      description: "Generate sample data for testing",
      icon: <Cloud className="h-6 w-6" />,
      color: "white",
    },
  ];

  return (
    <PageLayout
      title="Add Data Source"
      subtitle="Choose a data source type to get started"
      icon={Database}
      showNavigation={true}
      showBackButton={true}
      backButtonText="Back to Data Sources"
      backButtonHref={`/project/${projectId}/data-sources`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Remove the custom header since PageLayout handles it */}

      {/* Data Source Type Selection */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          Select Data Source Type
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSourceTypes.map((type) => (
            <button
              key={type.type}
              onClick={() => setImportType(type.type)}
              className={`p-4 rounded-lg border-2 transition-all ${
                importType === type.type
                  ? `border-${type.color}-400 bg-${type.color}-500/10`
                  : "border-dark_cyan-200 border-opacity-20 hover:border-opacity-40"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`text-${type.color}-400`}>{type.icon}</div>
                <h3 className="font-semibold text-white">{type.name}</h3>
              </div>
              <p className="text-sm text-dark_cyan-400">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Data Source Configuration */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Configure {dataSourceTypes.find((t) => t.type === importType)?.name}
        </h2>

        {importType === "csv" && (
          <FileUpload
            onFileUploaded={async (file, progress) => {
              // Handle file upload - this would need to be implemented
              // For now, just show a message
              clientLogger.info("File uploaded", "file-import", {
                fileName: file.name,
              });
            }}
            showPreview={true}
          />
        )}

        {importType === "sql_dump" && (
          <SqlDumpUpload
            projectId={projectId}
            onUploadComplete={async (progress) => {
              // Handle SQL dump upload completion
              clientLogger.info("SQL dump upload completed", "file-import", {
                progress,
              });
            }}
          />
        )}

        {importType === "mysql" && (
          <MySqlConnection
            projectId={projectId}
            onConnectionComplete={(success, message) => {
              if (success) {
                router.push(`/project/${projectId}/data-sources`);
              }
              clientLogger.info("MySQL connection result", "database", {
                success,
                message,
              });
            }}
          />
        )}

        {importType === "api_script" && (
          <ApiConnection
            project={project}
            onDataSourceCreated={handleDataSourceCreated}
            embedded={true}
          />
        )}

        {importType === "sql_dump" && (
          <CustomScriptEditor
            projectId={projectId}
            onScriptCreated={(provider) => {
              router.push(`/project/${projectId}/data-sources`);
              clientLogger.info(
                "Custom script provider created",
                "data-processing",
                {
                  providerId: provider.id,
                  providerName: provider.name,
                }
              );
            }}
          />
        )}

        {importType === "mock" && (
          <MockDataProviderComponent
            project={project}
            embedded={true}
            onDataSourceCreated={handleDataSourceCreated}
          />
        )}
      </div>
      </div>
    </PageLayout>
  );
}
