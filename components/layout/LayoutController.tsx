"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Zap,
  Clock,
  FileText,
  Settings,
  Cloud,
  Database,
} from "lucide-react";
import {
  useNavigation,
  NavigationPage,
} from "../../contexts/NavigationContext";
import AppSidebar from "./AppSidebar";
import TitleBar from "./TitleBar";
import Button from "../ui/Button";

// Import page components
import ProjectGrid from "../projects/ProjectGrid";
import EmptyState from "../projects/EmptyState";
import UnifiedJobPage from "../jobs/UnifiedJobPage";
import JobManagementPage from "../jobs/JobManagementPage";
import LogViewerPage from "../logs/LogViewerPage";
import DataWarehouseDashboard from "../data-warehouse/DataWarehouseDashboard";
import SettingsPage from "../../app/settings/page";
import BackupRestorePage from "../backup/BackupRestorePage";
import NewProjectModal from "../projects/NewProjectModal";

interface LayoutControllerProps {
  projects?: any[];
  onLoadProjects?: () => void;
  onNewProject?: () => void;
  onSettings?: () => void;
  onBackupRestore?: () => void;
  showAddDataSource?: boolean;
}

interface PageConfig {
  title: string;
  icon: React.ComponentType<any>;
  description?: string;
  headerActions?: React.ReactNode;
}

const PAGE_CONFIGS: Record<NavigationPage, PageConfig> = {
  projects: {
    title: "Projects",
    icon: Database,
    description: "Manage your data integration projects",
  },
  "job-monitor": {
    title: "Job Management",
    icon: Clock,
    description: "Monitor and manage all jobs and scheduled tasks",
  },
  "job-manager": {
    title: "Job Management",
    icon: Clock,
    description: "Monitor and manage all jobs and scheduled tasks",
  },
  "log-viewer": {
    title: "Log Viewer",
    icon: FileText,
    description: "Monitor application logs and system events",
  },
  settings: {
    title: "Settings",
    icon: Settings,
    description: "Configure application settings",
  },
  "backup-restore": {
    title: "Backup & Restore",
    icon: Cloud,
    description: "Backup and restore your data",
  },
};

const LayoutController: React.FC<LayoutControllerProps> = ({
  projects = [],
  onLoadProjects,
  onNewProject,
  onSettings,
  onBackupRestore,
  showAddDataSource = false,
}) => {
  const { navigationState, navigateTo, navigateBack, canGoBack, isActive } =
    useNavigation();
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  const currentPageConfig = PAGE_CONFIGS[navigationState.currentPage];
  const IconComponent = currentPageConfig.icon;

  // Handle sidebar navigation
  const handleSidebarNavigation = (page: NavigationPage) => {
    navigateTo(page);
  };

  // Render page content based on current navigation state
  const renderPageContent = () => {
    switch (navigationState.currentPage) {
      case "projects":
        return projects.length === 0 ? (
          <EmptyState onNewProject={() => setShowNewProjectModal(true)} />
        ) : (
          <ProjectGrid
            projects={projects}
            onProjectClick={(project) => {
              // Navigate to project page
              window.location.href = `/project/${project.id}`;
            }}
            onNewProject={() => setShowNewProjectModal(true)}
          />
        );

      case "job-monitor":
        return <JobManagementPage />;

      case "job-manager":
        return <DataWarehouseDashboard projectId="default" />;

      case "log-viewer":
        return (
          <div className="h-full">
            <LogViewerPage />
          </div>
        );

      case "settings":
        return (
          <div className="h-full">
            <SettingsPage />
          </div>
        );

      case "backup-restore":
        return (
          <div className="h-full">
            <BackupRestorePage
              project={null} // This would need to be passed from context
              dataSources={[]} // This would need to be passed from context
            />
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Database className="h-16 w-16 mx-auto mb-4 text-dark_cyan-400" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Page Not Found
              </h3>
              <p className="text-dark_cyan-400">
                The requested page could not be found.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <AppSidebar
        onNewProject={() => handleSidebarNavigation("projects")}
        onSettings={() => handleSidebarNavigation("settings")}
        onAddDataSource={onNewProject}
        onBackupRestore={() => handleSidebarNavigation("backup-restore")}
        showAddDataSource={showAddDataSource}
        onJobMonitor={() => handleSidebarNavigation("job-monitor")}
        onJobManager={() => handleSidebarNavigation("job-manager")}
        onLogViewer={() => handleSidebarNavigation("log-viewer")}
        onDataWarehouse={() => handleSidebarNavigation("job-manager")}
        activePage={navigationState.currentPage}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Title Bar */}
        <TitleBar title={`${currentPageConfig.title} - Manifold`} />

        {/* Page Header */}
        <div className="border-b border-dark_cyan-200 border-opacity-10 bg-dark_cyan-100 bg-opacity-20 sticky top-8 z-[50]">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-dark_cyan-500/20">
                    <IconComponent className="h-6 w-6 text-dark_cyan-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {currentPageConfig.title}
                    </h1>
                    {currentPageConfig.description && (
                      <p className="text-dark_cyan-400">
                        {currentPageConfig.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {currentPageConfig.headerActions}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-8">
          <div
            key={navigationState.currentPage}
            className="h-full page-transition"
          >
            {renderPageContent()}
          </div>
        </div>
      </main>

      {/* Modals */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onCreateProject={(project) => {
          setShowNewProjectModal(false);
          onLoadProjects?.();
        }}
      />
    </div>
  );
};

export default LayoutController;
