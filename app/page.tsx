"use client";

import { useState, useEffect } from "react";
import { Project } from "../types";
import AppSidebar from "../components/layout/AppSidebar";
import TitleBar from "../components/layout/TitleBar";
import ProjectGrid from "../components/projects/ProjectGrid";
import EmptyState from "../components/projects/EmptyState";
import NewProjectModal from "../components/projects/NewProjectModal";
import SettingsModal from "../components/ui/SettingsModal";
import BackupRestoreModal from "../components/backup/BackupRestoreModal";
import SystemTab from "../components/system/SystemTab";
import JobMonitorPage from "../components/system/JobMonitorPage";
import Button from "../components/ui/Button";
import { ArrowLeft, Monitor, Zap } from "lucide-react";
import { DatabaseService } from "../lib/services/DatabaseService";
import { RealSystemMonitor } from "../lib/services/RealSystemMonitor";
import { SampleDataGenerator } from "../lib/services/SampleDataGenerator";
import { logger } from "../lib/utils/logger";
import useViewTransition from "../hooks/useViewTransition";
import useKeyboardShortcuts, {
  COMMON_SHORTCUTS,
  createShortcut,
} from "../hooks/useKeyboardShortcuts";
import KeyboardShortcutsModal from "../components/ui/KeyboardShortcutsModal";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBackupRestoreModal, setShowBackupRestoreModal] = useState(false);
  const [showSystemMonitor, setShowSystemMonitor] = useState(false);
  const [showJobMonitor, setShowJobMonitor] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [systemMonitor] = useState(
    () => RealSystemMonitor.getInstance() as RealSystemMonitor
  );
  const [sampleDataGenerator] = useState(() =>
    SampleDataGenerator.getInstance()
  );

  const { navigateWithTransition } = useViewTransition();

  // Keyboard shortcuts configuration
  const shortcuts = [
    createShortcut(
      COMMON_SHORTCUTS.NEW_PROJECT,
      () => setShowNewProjectModal(true),
      "Create new project",
      { ctrlKey: true }
    ),
    createShortcut(
      COMMON_SHORTCUTS.OPEN_SETTINGS,
      () => setShowSettingsModal(true),
      "Open settings",
      { ctrlKey: true }
    ),
    createShortcut(
      COMMON_SHORTCUTS.SYSTEM_MONITOR,
      () => setShowSystemMonitor(true),
      "Open system monitor",
      { ctrlKey: true }
    ),
    createShortcut(
      COMMON_SHORTCUTS.JOB_MONITOR,
      () => openJobMonitor(),
      "Open job monitor",
      { ctrlKey: true }
    ),
    createShortcut(
      COMMON_SHORTCUTS.HELP,
      () => setShowKeyboardShortcuts(true),
      "Show keyboard shortcuts"
    ),
    createShortcut(
      COMMON_SHORTCUTS.ESCAPE,
      () => {
        setShowNewProjectModal(false);
        setShowSettingsModal(false);
        setShowSystemMonitor(false);
        setShowJobMonitor(false);
        setShowKeyboardShortcuts(false);
        setShowBackupRestoreModal(false);
      },
      "Close all modals"
    ),
  ];

  useKeyboardShortcuts({ shortcuts });

  useEffect(() => {
    // Initialize sample data and load projects
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      // Create sample data if none exists
      await sampleDataGenerator.createSampleData();

      // Load projects
      await loadProjects();

      // Refresh jobs from data sources
      await systemMonitor.refreshJobs();

      logger.success("Data initialization completed", "system");
    } catch (error) {
      logger.error("Failed to initialize data", "system", { error });
      // Still try to load projects even if sample data creation fails
      await loadProjects();
    }
  };

  const openJobMonitor = async () => {
    try {
      // Refresh jobs before opening monitor
      await systemMonitor.refreshJobs();
      setShowJobMonitor(true);
    } catch (error) {
      logger.error("Failed to refresh jobs", "system", { error });
      // Still open the monitor even if refresh fails
      setShowJobMonitor(true);
    }
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      logger.info(
        "Loading projects from database",
        "database",
        undefined,
        "HomePage"
      );

      const dbService = DatabaseService.getInstance();
      const loadedProjects = await dbService.getProjects();

      setProjects(loadedProjects);
      setLoading(false);

      logger.success(
        "Projects loaded successfully",
        "database",
        { count: loadedProjects.length },
        "HomePage"
      );
    } catch (error) {
      logger.error(
        "Failed to load projects",
        "database",
        { error },
        "HomePage"
      );
      setLoading(false);
    }
  };

  const handleCreateProject = async (project: Project) => {
    try {
      logger.info(
        "Creating new project",
        "user-action",
        { projectName: project.name },
        "HomePage"
      );

      const dbService = DatabaseService.getInstance();
      await dbService.createProject(project);

      // Reload projects from database
      await loadProjects();

      setShowNewProjectModal(false);
      logger.success(
        "Project created successfully",
        "user-action",
        { projectId: project.id, projectName: project.name },
        "HomePage"
      );
    } catch (error) {
      logger.error(
        "Failed to create project",
        "user-action",
        { error, projectName: project.name },
        "HomePage"
      );
      throw error;
    }
  };

  const openProject = (project: Project) => {
    logger.info(
      "Opening project",
      "user-action",
      { projectId: project.id, projectName: project.name },
      "HomePage"
    );
    // Navigate to project workspace with smooth transition
    navigateWithTransition(`/project/${project.id}`, {
      type: "blur",
      duration: 250,
      showLoading: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/30 border-t-white/80 mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading Manifold...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <AppSidebar
        onNewProject={() => setShowNewProjectModal(true)}
        onSettings={() => setShowSettingsModal(true)}
        onBackupRestore={() => setShowBackupRestoreModal(true)}
        onSystemMonitor={() => setShowSystemMonitor(true)}
        onJobMonitor={openJobMonitor}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Title Bar */}
        <TitleBar title="Manifold - Data Integration Platform" />

        {/* Content */}
        <div className="flex-1 p-8">
          {showJobMonitor ? (
            <div className="h-full">
              <JobMonitorPage onBack={() => setShowJobMonitor(false)} />
            </div>
          ) : showSystemMonitor ? (
            <div className="h-full">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => setShowSystemMonitor(false)}
                      variant="outline"
                      icon={<ArrowLeft className="h-4 w-4" />}
                    >
                      Back to Projects
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Monitor className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">
                      System Monitor
                    </h1>
                    <p className="text-white/60">
                      Real-time system metrics and task monitoring
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100vh-200px)]">
                <SystemTab isActive={true} />
              </div>
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onNewProject={() => setShowNewProjectModal(true)} />
          ) : (
            <ProjectGrid
              projects={projects}
              onProjectClick={openProject}
              onNewProject={() => setShowNewProjectModal(true)}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreateProject={handleCreateProject}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onBackupRestore={() => {
          setShowSettingsModal(false);
          setShowBackupRestoreModal(true);
        }}
      />

      <BackupRestoreModal
        isOpen={showBackupRestoreModal}
        onClose={() => setShowBackupRestoreModal(false)}
        project={null}
        dataSources={[]}
      />

      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
        shortcuts={shortcuts}
      />
    </div>
  );
}
