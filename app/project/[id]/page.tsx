"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Project, DataSource, DataSourceType } from "../../../types";
import AppSidebar from "../../../components/layout/AppSidebar";
import TitleBar from "../../../components/layout/TitleBar";
import ProjectHeader from "../../../components/projects/ProjectHeader";
import DataSourcesPanel from "../../../components/projects/DataSourcesPanel";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import SettingsModal from "../../../components/ui/SettingsModal";
import BackupRestoreModal from "../../../components/backup/BackupRestoreModal";
import BackupConfigModal from "../../../components/backup/BackupConfigModal";
import RenameProjectModal from "../../../components/projects/RenameProjectModal";
import FileUpload from "../../../components/data-sources/FileUpload";
import SqlDumpUpload from "../../../components/data-sources/SqlDumpUpload";
import MySqlConnection from "../../../components/data-sources/MySqlConnection";
import CustomScriptEditor from "../../../components/data-sources/CustomScriptEditor";
import ApiConnection from "../../../components/data-sources/ApiConnection";
import EditDataSourceModal from "../../../components/data-sources/EditDataSourceModal";
import BackupManager from "../../../components/backup/BackupManager";
import MockDataProviderComponent from "../../../components/providers/MockDataProvider";
import SqlEditor from "../../../components/editor/SqlEditor";
import ConsolidatedModelBuilder from "../../../components/model/ConsolidatedModelBuilder";
import ComplexRelationshipBuilder from "../../../components/model/ComplexRelationshipBuilder";
import ExportDataModal from "../../../components/export/ExportDataModal";
import SnapshotViewer from "../../../components/debug/SnapshotViewer";
import DeleteConfirmationModal from "../../../components/ui/DeleteConfirmationModal";
import LogToggle from "../../../components/logs/LogToggle";
import ImportTimeline from "../../../components/projects/ImportTimeline";
import { DatabaseService } from "../../../lib/services/DatabaseService";
import { ImportProgress } from "../../../types";
import { logger } from "../../../lib/utils/logger";
import { SnapshotUtils } from "../../../lib/utils/snapshotUtils";
import {
  ArrowLeft,
  Database,
  Code,
  FileText,
  Globe,
  Settings,
  Network,
} from "lucide-react";
import useViewTransition from "../../../hooks/useViewTransition";

// Force dynamic rendering since we use client-side hooks
export const dynamic = "force-dynamic";

export default function ProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const dbService = DatabaseService.getInstance();

  const [project, setProject] = useState<Project | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [showBackupConfigModal, setShowBackupConfigModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showSqlEditor, setShowSqlEditor] = useState(false);
  const [showModelBuilder, setShowModelBuilder] = useState(false);
  const [showComplexModelBuilder, setShowComplexModelBuilder] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSnapshotViewer, setShowSnapshotViewer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dataSourceToDelete, setDataSourceToDelete] =
    useState<DataSource | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [dataSourceToEdit, setDataSourceToEdit] = useState<DataSource | null>(
    null
  );
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0);
  const [importType, setImportType] = useState<DataSourceType>("file");
  const [selectedDataSource, setSelectedDataSource] =
    useState<DataSource | null>(null);
  const [sourceData, setSourceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { goBackWithTransition } = useViewTransition();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Test log message to verify logger is working
  useEffect(() => {
    logger.info("Project page loaded", "ui", { projectId }, "ProjectPage");
  }, [projectId]);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      logger.info("Loading project", "database", { projectId }, "ProjectPage");

      const loadedProject = await dbService.getProject(projectId);

      if (!loadedProject) {
        logger.error(
          "Project not found",
          "database",
          { projectId },
          "ProjectPage"
        );
        setLoading(false);
        return;
      }

      setProject(loadedProject);

      // Load data sources for this project
      const loadedDataSources = await dbService.getDataSources(projectId);
      setDataSources(loadedDataSources);

      setLoading(false);
      logger.success(
        "Project loaded successfully",
        "database",
        {
          projectId,
          projectName: loadedProject.name,
          dataSourceCount: loadedDataSources.length,
        },
        "ProjectPage"
      );
    } catch (error) {
      logger.error(
        "Failed to load project",
        "database",
        { projectId, error },
        "ProjectPage"
      );
      setLoading(false);
    }
  }, [projectId]);

  const handleFileUpload = async (file: File, progress: ImportProgress) => {
    logger.info(
      "File upload initiated",
      "file-import",
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        stage: progress.stage,
        progress: progress.progress,
      },
      "ProjectPage",
      projectId
    );

    // TODO: Implement actual file import
    if (progress.stage === "complete") {
      logger.success(
        "File upload completed",
        "file-import",
        { fileName: file.name },
        "ProjectPage",
        projectId
      );
    } else if (progress.stage === "error") {
      logger.error(
        "File upload failed",
        "file-import",
        { fileName: file.name, error: progress.error },
        "ProjectPage",
        projectId
      );
    }
  };

  const getDataSourceIcon = (type: DataSourceType) => {
    switch (type) {
      case "file":
        return <FileText className="h-5 w-5" />;
      case "sql_dump":
        return <Database className="h-5 w-5" />;
      case "custom_script":
        return <Code className="h-5 w-5" />;
      case "api":
        return <Globe className="h-5 w-5" />;
      case "mock":
        return <Database className="h-5 w-5" />;
      case "mysql":
        return <Database className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  const getDataSourceTypeLabel = (type: DataSourceType) => {
    switch (type) {
      case "file":
        return "File Upload";
      case "sql_dump":
        return "SQL Dump";
      case "custom_script":
        return "Custom Script";
      case "api":
        return "API Endpoint";
      case "mock":
        return "Mock Data";
      case "mysql":
        return "MySQL Database";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white/80 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="glass-card rounded-2xl p-8 max-w-md mx-auto">
            <h1 className="text-2xl font-bold text-white mb-4">
              Project Not Found
            </h1>
            <p className="text-white/70 mb-8">
              The requested project could not be found.
            </p>
            <Button onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleViewData = async (source: DataSource) => {
    logger.info(
      "Viewing data for source",
      "api",
      { sourceId: source.id },
      "ProjectPage"
    );

    // Mock data generation - in real app, fetch from API
    const mockData = generateMockData(source);
    setSourceData(mockData);
    setSelectedDataSource(source);
  };

  const handleDeleteDataSource = (source: DataSource) => {
    setDataSourceToDelete(source);
    setShowDeleteModal(true);
  };

  const handleEditDataSource = (source: DataSource) => {
    setDataSourceToEdit(source);
    setShowEditModal(true);
  };

  const handleDataSourceUpdated = async (updatedDataSource: DataSource) => {
    try {
      await dbService.updateDataSource(updatedDataSource.id, updatedDataSource);

      // Update the local data sources list
      setDataSources((prev) =>
        prev.map((ds) =>
          ds.id === updatedDataSource.id ? updatedDataSource : ds
        )
      );

      setShowEditModal(false);
      setDataSourceToEdit(null);

      logger.success(
        "Data source updated successfully",
        "user-action",
        {
          dataSourceId: updatedDataSource.id,
          dataSourceName: updatedDataSource.name,
        },
        "ProjectPage"
      );
    } catch (error) {
      console.error("Failed to update data source:", error);
      logger.error(
        "Failed to update data source",
        "user-action",
        { error, dataSourceId: updatedDataSource.id },
        "ProjectPage"
      );
    }
  };

  const confirmDeleteDataSource = async () => {
    if (!dataSourceToDelete) return;

    setDeleting(true);
    try {
      // Delete the data source
      await dbService.deleteDataSource(dataSourceToDelete.id, projectId);

      // Also delete associated snapshots
      const snapshots = await dbService.getSnapshots(projectId);
      const sourceSnapshots = snapshots.filter(
        (s) => s.dataSourceId === dataSourceToDelete.id
      );

      for (const snapshot of sourceSnapshots) {
        await dbService.deleteSnapshot(snapshot.id, projectId);
      }

      // Update the data sources list
      setDataSources((prev) =>
        prev.filter((ds) => ds.id !== dataSourceToDelete.id)
      );

      // Clear selected data source if it was deleted
      if (selectedDataSource?.id === dataSourceToDelete.id) {
        setSelectedDataSource(null);
        setSourceData([]);
      }

      logger.success(
        "Data source deleted successfully",
        "user-action",
        {
          dataSourceId: dataSourceToDelete.id,
          dataSourceName: dataSourceToDelete.name,
          deletedSnapshots: sourceSnapshots.length,
        },
        "ProjectPage"
      );
    } catch (error) {
      logger.error(
        "Failed to delete data source",
        "user-action",
        { error, dataSourceId: dataSourceToDelete.id },
        "ProjectPage"
      );
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setDataSourceToDelete(null);
    }
  };

  const generateMockData = (source: DataSource): any[] => {
    const data = [];
    const columns = ["id", "name", "value", "category", "date", "status"];

    for (let i = 0; i < 100; i++) {
      data.push({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 1000),
        category: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)],
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        status: ["active", "inactive", "pending"][
          Math.floor(Math.random() * 3)
        ],
      });
    }

    return data;
  };

  const handleRunSource = async (source: DataSource) => {
    logger.info(
      "Running data source",
      "data-processing",
      { sourceId: source.id, sourceName: source.name },
      "ProjectPage"
    );

    try {
      // Update the data source status
      await dbService.updateDataSource(source.id, {
        ...source,
        status: "running",
        lastSyncAt: new Date(),
      });

      // Reload data sources to reflect the update
      const updatedDataSources = await dbService.getDataSources(projectId);
      setDataSources(updatedDataSources);

      // TODO: Implement actual data source execution
      // For now, just simulate success after a delay
      setTimeout(async () => {
        try {
          // Update data source status
          await dbService.updateDataSource(source.id, {
            ...source,
            status: "completed",
            lastSyncAt: new Date(),
          });

          // Create a new snapshot for this import/run
          console.log("Creating snapshot for data source run:", source.name);

          if (source.type === "api") {
            // For API data sources, fetch fresh data from the API
            const { ApiProvider } = await import(
              "../../../lib/services/ApiProvider"
            );
            const apiProvider = ApiProvider.getInstance();
            const snapshot = await apiProvider.createSnapshotFromApi(
              source,
              projectId
            );
            await dbService.createSnapshot(snapshot);
            console.log("API snapshot created successfully for:", source.name);
          } else {
            // For other data sources (mock, etc.), use the existing logic
            await SnapshotUtils.createSnapshotFromMockData(source, projectId);
            console.log("Snapshot created successfully for:", source.name);
          }

          // Trigger Import Timeline refresh
          setTimelineRefreshTrigger((prev) => prev + 1);

          const finalDataSources = await dbService.getDataSources(projectId);
          setDataSources(finalDataSources);

          logger.success(
            "Data source executed successfully",
            "data-processing",
            { sourceId: source.id },
            "ProjectPage"
          );
        } catch (error) {
          console.error("Error during data source execution:", error);
          logger.error(
            "Failed to complete data source execution",
            "data-processing",
            { error, sourceId: source.id },
            "ProjectPage"
          );
        }
      }, 2000);
    } catch (error) {
      logger.error(
        "Failed to run data source",
        "data-processing",
        { error, sourceId: source.id },
        "ProjectPage"
      );
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <AppSidebar
        onNewProject={() =>
          goBackWithTransition({
            type: "blur",
            duration: 250,
            showLoading: true,
          })
        }
        onSettings={() => setShowSettingsModal(true)}
        onBackupRestore={() => setShowBackupRestoreModal(true)}
        onAddDataSource={() => setShowImportModal(true)}
        showAddDataSource={true}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Title Bar */}
        <TitleBar title={`${project.name} - Manifold`} />

        {/* Project Header */}
        <ProjectHeader
          project={project}
          onBack={() =>
            goBackWithTransition({
              type: "blur",
              duration: 250,
              showLoading: true,
            })
          }
          onSettings={() => setShowSettingsModal(true)}
        />

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Data Sources Panel */}
            <div className="lg:col-span-2 space-y-6">
              <DataSourcesPanel
                dataSources={dataSources}
                onAddSource={() => setShowImportModal(true)}
                onRunSource={handleRunSource}
                onViewData={handleViewData}
                onEditSource={handleEditDataSource}
                onDeleteSource={handleDeleteDataSource}
                selectedSource={selectedDataSource}
                sourceData={sourceData}
              />

              {/* Import Timeline */}
              <ImportTimeline
                projectId={projectId}
                refreshTrigger={timelineRefreshTrigger}
              />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Project Info */}
              <div className="card rounded-2xl p-6">
                <h3 className="text-subheading text-white mb-4">
                  Project Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-label">Created</label>
                    <p className="text-body text-white">
                      {project.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-label">Last Updated</label>
                    <p className="text-body text-white">
                      {project.updatedAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-label">Data Sources</label>
                    <p className="text-body text-white">
                      {dataSources.length} sources
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card rounded-2xl p-6">
                <h3 className="text-subheading text-white mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowModelBuilder(true)}
                    disabled={dataSources.length === 0}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Build Consolidated Model
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowComplexModelBuilder(true)}
                    disabled={dataSources.length < 2}
                  >
                    <Network className="h-4 w-4 mr-2" />
                    Complex Relationships
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowSqlEditor(true)}
                    disabled={dataSources.length === 0}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    Open SQL Editor
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowExportModal(true)}
                    disabled={dataSources.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowSnapshotViewer(true)}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    View Snapshots
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowBackupConfigModal(true)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Backup Settings
                  </Button>
                </div>
              </div>

              {/* Backup Manager */}
              <BackupManager
                project={project}
                dataSources={dataSources}
                onRestore={(restoredProject, restoredDataSources) => {
                  setProject(restoredProject);
                  setDataSources(restoredDataSources);
                  logger.success(
                    "Project restored from backup",
                    "api",
                    { projectId: restoredProject.id },
                    "ProjectPage"
                  );
                }}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Add Data Source"
        size="lg"
      >
        <div className="space-y-6">
          {/* Source Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-4">
              Choose Data Source Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  "file",
                  "sql_dump",
                  "custom_script",
                  "api",
                  "mock",
                  "mysql",
                ] as DataSourceType[]
              ).map((type) => (
                <button
                  key={type}
                  onClick={() => setImportType(type)}
                  className={`p-4 card rounded-xl text-left transition-all duration-200 ${
                    importType === type
                      ? "btn-primary border-blue-400/50"
                      : "card-interactive hover:btn-primary"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="p-1 rounded-lg btn-primary mr-2">
                      {getDataSourceIcon(type)}
                    </div>
                    <span className="font-semibold text-white">
                      {getDataSourceTypeLabel(type)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Import Interface */}
          {importType === "file" && (
            <FileUpload onFileUploaded={handleFileUpload} />
          )}

          {importType === "sql_dump" && (
            <SqlDumpUpload
              projectId={projectId}
              onUploadComplete={(progress) => {
                if (progress.stage === "complete") {
                  setShowImportModal(false);
                  // Reload data sources
                  loadProject();
                } else if (progress.stage === "error") {
                  logger.error(
                    "SQL dump import failed",
                    "file-import",
                    { error: progress.error },
                    "ProjectPage"
                  );
                }
              }}
            />
          )}

          {importType === "api" && (
            <ApiConnection
              project={project}
              onDataSourceCreated={async (dataSource) => {
                try {
                  console.log(
                    "ProjectPage: API data source created callback called"
                  );
                  console.log("ProjectPage: Project data:", project);
                  console.log("ProjectPage: Data source data:", dataSource);
                  console.log(
                    "ProjectPage: Project ID from params:",
                    projectId
                  );
                  console.log(
                    "ProjectPage: Data source project ID:",
                    dataSource.projectId
                  );

                  await dbService.createDataSource(dataSource);
                  const updatedDataSources = await dbService.getDataSources(
                    projectId
                  );
                  setDataSources(updatedDataSources);

                  // Create snapshot for the API data source
                  const { ApiProvider } = await import(
                    "../../../lib/services/ApiProvider"
                  );
                  const apiProvider = ApiProvider.getInstance();
                  const snapshot = await apiProvider.createSnapshotFromApi(
                    dataSource,
                    projectId
                  );

                  await dbService.createSnapshot(snapshot);

                  // Trigger Import Timeline refresh
                  setTimelineRefreshTrigger((prev) => prev + 1);

                  logger.info(
                    "API data source created successfully",
                    "data-processing",
                    {
                      dataSourceId: dataSource.id,
                      dataSourceName: dataSource.name,
                      projectId,
                    },
                    "ProjectPage"
                  );
                } catch (error) {
                  console.error("Failed to create API data source:", error);
                  logger.error(
                    "Failed to create API data source",
                    "data-processing",
                    { error },
                    "ProjectPage"
                  );
                }
              }}
              embedded={true}
            />
          )}

          {importType === "mock" && (
            <MockDataProviderComponent
              project={project}
              embedded={true}
              onDataSourceCreated={async (dataSource) => {
                try {
                  // Save the data source to the database
                  await dbService.createDataSource(dataSource);

                  // Create a snapshot for the import history
                  try {
                    console.log("ProjectPage: About to create snapshot", {
                      dataSourceId: dataSource.id,
                      dataSourceName: dataSource.name,
                      projectId,
                    });

                    await SnapshotUtils.createSnapshotFromMockData(
                      dataSource,
                      projectId
                    );

                    // Trigger Import Timeline refresh
                    setTimelineRefreshTrigger((prev) => prev + 1);

                    console.log("ProjectPage: Snapshot created successfully");

                    logger.info(
                      "Snapshot created for mock data source",
                      "data-processing",
                      {
                        dataSourceId: dataSource.id,
                        dataSourceName: dataSource.name,
                      },
                      "ProjectPage"
                    );
                  } catch (snapshotError) {
                    logger.warn(
                      "Failed to create snapshot for mock data source",
                      "data-processing",
                      {
                        error: snapshotError,
                        dataSourceId: dataSource.id,
                      },
                      "ProjectPage"
                    );
                    // Don't fail the entire operation if snapshot creation fails
                  }

                  // Update local state
                  setDataSources((prev) => [...prev, dataSource]);
                  setShowImportModal(false);

                  logger.success(
                    "Mock data source created and saved",
                    "data-processing",
                    {
                      dataSourceId: dataSource.id,
                      dataSourceName: dataSource.name,
                    },
                    "ProjectPage"
                  );
                } catch (error) {
                  logger.error(
                    "Failed to save mock data source",
                    "data-processing",
                    {
                      error: error instanceof Error ? error.message : error,
                      dataSourceId: dataSource.id,
                      dataSource: dataSource,
                      electronAPI: !!(window as any).electronAPI
                        ?.createDataSource,
                    },
                    "ProjectPage"
                  );
                  // Still close the modal but show error
                  setShowImportModal(false);
                }
              }}
            />
          )}

          {importType === "mysql" && (
            <MySqlConnection
              projectId={projectId}
              onConnectionComplete={(success, message) => {
                if (success) {
                  setShowImportModal(false);
                  // Reload data sources
                  loadProject();
                }
                logger.info(
                  "MySQL connection result",
                  "database",
                  { success, message },
                  "ProjectPage"
                );
              }}
            />
          )}

          {importType === "custom_script" && (
            <CustomScriptEditor
              projectId={projectId}
              onScriptCreated={(provider) => {
                setShowImportModal(false);
                loadProject(); // Reload data sources
                logger.info(
                  "Custom script provider created",
                  "data-processing",
                  { providerId: provider.id, providerName: provider.name },
                  "ProjectPage"
                );
              }}
            />
          )}
        </div>
      </Modal>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onBackupRestore={() => {
          setShowSettingsModal(false);
          setShowBackupRestoreModal(true);
        }}
        onRenameProject={() => {
          setShowSettingsModal(false);
          setShowRenameModal(true);
        }}
        project={project}
      />

      <BackupRestoreModal
        isOpen={showBackupRestoreModal}
        onClose={() => setShowBackupRestoreModal(false)}
        project={project}
        dataSources={dataSources}
      />

      <BackupConfigModal
        isOpen={showBackupConfigModal}
        onClose={() => setShowBackupConfigModal(false)}
        project={project}
        dataSources={dataSources}
      />

      <RenameProjectModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        project={project}
        onProjectRenamed={(updatedProject) => {
          setProject(updatedProject);
          logger.success(
            "Project renamed successfully",
            "user-action",
            {
              projectId: updatedProject.id,
              newName: updatedProject.name,
            },
            "ProjectPage"
          );
        }}
      />

      {/* Quick Actions Modals */}
      <SqlEditor
        isOpen={showSqlEditor}
        onClose={() => setShowSqlEditor(false)}
        dataSources={dataSources}
        projectId={projectId}
      />

      <ConsolidatedModelBuilder
        isOpen={showModelBuilder}
        onClose={() => setShowModelBuilder(false)}
        dataSources={dataSources}
        projectId={projectId}
      />

      {/* Complex Relationship Builder */}
      <ComplexRelationshipBuilder
        isOpen={showComplexModelBuilder}
        onClose={() => setShowComplexModelBuilder(false)}
        dataSources={dataSources}
        projectId={projectId}
      />

      {/* Snapshot Viewer */}
      <SnapshotViewer
        isOpen={showSnapshotViewer}
        onClose={() => setShowSnapshotViewer(false)}
        projectId={projectId}
        dataSources={dataSources}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteDataSource}
        title="Delete Data Source"
        description="Are you sure you want to delete this data source? This will also delete all associated snapshots and cannot be undone."
        itemName={dataSourceToDelete?.name || ""}
        itemType="Data Source"
        isLoading={deleting}
      />

      {/* Edit Data Source Modal */}
      {dataSourceToEdit && (
        <EditDataSourceModal
          dataSource={dataSourceToEdit}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setDataSourceToEdit(null);
          }}
          onDataSourceUpdated={handleDataSourceUpdated}
        />
      )}

      <ExportDataModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        dataSources={dataSources}
        projectId={projectId}
      />

      {/* Log Toggle */}
      <LogToggle />
    </div>
  );
}
