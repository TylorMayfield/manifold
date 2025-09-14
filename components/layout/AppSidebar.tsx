"use client";

import { Database, Settings, Plus, Cloud, Monitor, Zap } from "lucide-react";
import Button from "../ui/Button";
import JobMonitor from "../system/JobMonitor";

interface AppSidebarProps {
  onNewProject: () => void;
  onSettings: () => void;
  onAddDataSource?: () => void;
  onBackupRestore?: () => void;
  showAddDataSource?: boolean;
  onSystemMonitor?: () => void;
  onJobMonitor?: () => void;
}

export default function AppSidebar({
  onNewProject,
  onSettings,
  onAddDataSource,
  onBackupRestore,
  showAddDataSource = false,
  onSystemMonitor,
  onJobMonitor,
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
          <button className="w-full flex items-center px-3 py-2 text-sm text-white bg-white bg-opacity-10 rounded-lg">
            <Database className="h-4 w-4 mr-3" />
            Projects
          </button>
          {onSystemMonitor && (
            <button
              onClick={onSystemMonitor}
              className="w-full flex items-center px-3 py-2 text-sm text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-5 rounded-lg transition-colors"
            >
              <Monitor className="h-4 w-4 mr-3" />
              System Monitor
            </button>
          )}
          {onJobMonitor && (
            <button
              onClick={onJobMonitor}
              className="w-full flex items-center px-3 py-2 text-sm text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-5 rounded-lg transition-colors"
            >
              <Zap className="h-4 w-4 mr-3" />
              Job Monitor
            </button>
          )}
          <button
            onClick={onSettings}
            className="w-full flex items-center px-3 py-2 text-sm text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-5 rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4 mr-3" />
            Settings
          </button>
          {onBackupRestore && (
            <button
              onClick={onBackupRestore}
              className="w-full flex items-center px-3 py-2 text-sm text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-5 rounded-lg transition-colors"
            >
              <Cloud className="h-4 w-4 mr-3" />
              Backup & Restore
            </button>
          )}
        </div>
      </nav>

      {/* Job Monitor */}
      <div className="px-4 pb-4">
        <JobMonitor compact={true} />
      </div>

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
