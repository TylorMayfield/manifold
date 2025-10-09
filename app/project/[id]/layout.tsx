"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Project, DataSource } from "../../../types";
import AppSidebar from "../../../components/layout/AppSidebar";
import TitleBar from "../../../components/layout/TitleBar";
import StandardLoading from "../../../components/layout/StandardLoading";
import { clientDatabaseService } from "../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../lib/utils/ClientLogger";
import { ArrowLeft, Database, Settings, AlertTriangle } from "lucide-react";
import Button from "../../../components/ui/Button";
import useViewTransition from "../../../hooks/useViewTransition";

// Force dynamic rendering since we use client-side hooks
export const dynamic = "force-dynamic";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;

  const [project, setProject] = useState<Project | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  const { goBackWithTransition } = useViewTransition();

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      clientLogger.info(
        "Loading project",
        "database",
        { projectId },
        "ProjectLayout"
      );

      const loadedProject = await dbService.getProject(projectId);

      if (!loadedProject) {
        clientLogger.error(
          "Project not found",
          "database",
          { projectId },
          "ProjectLayout"
        );
        setLoading(false);
        return;
      }

      setProject(loadedProject);

      // Load data sources for this project
      const loadedDataSources = await dbService.getDataSources(projectId);
      setDataSources(loadedDataSources);

      setLoading(false);
      clientLogger.success(
        "Project loaded successfully",
        "database",
        {
          projectId,
          projectName: loadedProject.name,
          dataSourceCount: loadedDataSources.length,
        },
        "ProjectLayout"
      );
    } catch (error) {
      clientLogger.error(
        "Failed to load project",
        "database",
        { projectId, error },
        "ProjectLayout"
      );
      setLoading(false);
    }
  }, [projectId]);

  const handleBackToProjects = () => {
    router.push("/");
  };

  const handleSettings = () => {
    router.push(`/project/${projectId}/settings`);
  };

  if (loading) {
    return (
      <StandardLoading
        message="Loading Project..."
        submessage="Initializing project workspace and data sources..."
      />
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="mb-8">
            <div className="mx-auto w-32 h-32 rounded-full bg-jasper-500/20 flex items-center justify-center mb-6">
              <AlertTriangle className="w-16 h-16 text-jasper-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Project Not Found
            </h1>
            <p className="text-dark_cyan-400 text-lg mb-8">
              The project you're looking for doesn't exist or you don't have
              access to it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/")}
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <AppSidebar
        onNewProject={handleBackToProjects}
        onSettings={() => router.push("/")}
        onBackupRestore={() => router.push("/")}
        onAddDataSource={() =>
          router.push(`/project/${projectId}/add-data-source`)
        }
        showAddDataSource={true}
        onJobMonitor={() => router.push("/")}
        onJobManager={() => router.push("/")}
        onLogViewer={() => router.push("/")}
        activePage="projects"
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Title Bar */}
        <TitleBar title={`${project.name} - Manifold`} />

        {/* Page Header */}
        <div className="border-b border-dark_cyan-200 border-opacity-10 bg-dark_cyan-100 bg-opacity-20 sticky top-8 z-[50]">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-dark_cyan-500/20">
                    <Database className="h-6 w-6 text-dark_cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {project.name}
                    </h1>
                    <p className="text-dark_cyan-400">
                      Data integration and workflow management
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleBackToProjects}
                  variant="outline"
                  size="sm"
                  icon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back to Projects
                </Button>
                <Button
                  onClick={handleSettings}
                  variant="outline"
                  size="sm"
                  icon={<Settings className="h-4 w-4" />}
                >
                  Settings
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
