"use client";

import {
  Database,
  Settings,
  Plus,
  Cloud,
  Zap,
  Clock,
  FileText,
  BarChart3,
} from "lucide-react";
import Button from "../ui/Button";
import { NavigationPage } from "../../contexts/NavigationContext";

interface AppSidebarProps {
  onNewProject: () => void;
  onSettings: () => void;
  onAddDataSource?: () => void;
  onBackupRestore?: () => void;
  showAddDataSource?: boolean;
  onJobMonitor?: () => void;
  onJobManager?: () => void;
  onLogViewer?: () => void;
  onDataWarehouse?: () => void;
  activePage?: NavigationPage;
}

export default function AppSidebar({
  onNewProject,
  onSettings,
  onAddDataSource,
  onBackupRestore,
  showAddDataSource = false,
  onJobMonitor,
  onJobManager,
  onLogViewer,
  onDataWarehouse,
  activePage = "projects",
}: AppSidebarProps) {
  return (
    <aside className="w-64 native-sidebar flex flex-col">
      {/* App Branding */}
      <div className="p-6 border-b border-white border-opacity-10">
        <div className="flex items-center">
          <div className="p-2 rounded-lg btn-primary mr-3">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Manifold</h1>
            <span className="text-xs text-white text-opacity-60">v0.1.0</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <button
            onClick={onNewProject}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              activePage === "projects"
                ? "text-white bg-tangerine-500 bg-opacity-20 border border-tangerine-400 border-opacity-30"
                : "text-white text-opacity-70 hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-10"
            }`}
          >
            <Database className="h-4 w-4 mr-3" />
            Projects
          </button>
          {(onJobMonitor || onJobManager) && (
            <button
              onClick={onJobMonitor || onJobManager}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                activePage === "job-monitor" || activePage === "job-manager"
                  ? "text-white bg-tangerine-500 bg-opacity-20 border border-tangerine-400 border-opacity-30"
                  : "text-white text-opacity-70 hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-10"
              }`}
            >
              <Clock className="h-4 w-4 mr-3" />
              Job Management
            </button>
          )}
          {onLogViewer && (
            <button
              onClick={onLogViewer}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                activePage === "log-viewer"
                  ? "text-white bg-tangerine-500 bg-opacity-20 border border-tangerine-400 border-opacity-30"
                  : "text-white text-opacity-70 hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-10"
              }`}
            >
              <FileText className="h-4 w-4 mr-3" />
              Log Viewer
            </button>
          )}
          {onDataWarehouse && (
            <button
              onClick={onDataWarehouse}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                activePage === "job-manager"
                  ? "text-white bg-tangerine-500 bg-opacity-20 border border-tangerine-400 border-opacity-30"
                  : "text-white text-opacity-70 hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-10"
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-3" />
              Data Warehouse
            </button>
          )}
          <button
            onClick={onSettings}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
              activePage === "settings"
                ? "text-white bg-tangerine-500 bg-opacity-20 border border-tangerine-400 border-opacity-30"
                : "text-white text-opacity-70 hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-10"
            }`}
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </button>
          {onBackupRestore && (
            <button
              onClick={onBackupRestore}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                activePage === "backup-restore"
                  ? "text-white bg-tangerine-500 bg-opacity-20 border border-tangerine-400 border-opacity-30"
                  : "text-white text-opacity-70 hover:text-white hover:bg-dark_cyan-300 hover:bg-opacity-10"
              }`}
            >
              <Cloud className="h-4 w-4 mr-3" />
              Backup & Restore
            </button>
          )}
        </div>
      </nav>

      {/* Job Monitor removed - system monitor was removed */}

      {/* Quick Actions */}
      <div className="p-4 border-t border-white border-opacity-10">
        <Button
          onClick={showAddDataSource ? onAddDataSource : onNewProject}
          className="w-full"
          icon={<Plus className="h-4 w-4" />}
        >
          {showAddDataSource ? "Add Data Source" : "New Project"}
        </Button>
      </div>
    </aside>
  );
}
