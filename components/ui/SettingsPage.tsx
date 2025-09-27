"use client";

import { useState } from "react";
import {
  Volume2,
  VolumeX,
  Cloud,
  Download,
  Edit3,
  ArrowLeft,
  Save,
  Bell,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";
import Button from "./Button";
import { Project } from "../../types";

interface SettingsPageProps {
  onRenameProject?: () => void;
  project?: Project | null;
}

export default function SettingsPage({
  onRenameProject,
  project,
}: SettingsPageProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    // Save settings logic here
    console.log("Settings saved:", {
      soundEnabled,
      autoSave,
      notifications,
    });
    // Could show a success message here
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action Buttons */}
      <div className="flex items-center justify-end p-6 border-b border-dark_cyan-200 border-opacity-10">
        <Button onClick={handleSave} variant="default" size="sm">
          Save Settings
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8">
          {/* Settings Overview */}
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Audio Status Card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-tangerine-500/20">
                    {soundEnabled ? (
                      <Volume2 className="h-5 w-5 text-tangerine-400" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-tangerine-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-white">Audio</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {soundEnabled ? (
                      <CheckCircle className="h-4 w-4 text-apricot-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-jasper-400" />
                    )}
                    <span className="text-sm text-dark_cyan-400">
                      {soundEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="text-xs text-dark_cyan-500">
                    Sound effects and notifications
                  </div>
                </div>
              </div>

              {/* Auto-save Status Card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-apricot-500/20">
                    <Save className="h-5 w-5 text-apricot-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Auto-save
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {autoSave ? (
                      <CheckCircle className="h-4 w-4 text-apricot-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-jasper-400" />
                    )}
                    <span className="text-sm text-dark_cyan-400">
                      {autoSave ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="text-xs text-dark_cyan-500">
                    Automatically save your work
                  </div>
                </div>
              </div>

              {/* Notifications Status Card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-dark_cyan-500/20">
                    <Bell className="h-5 w-5 text-dark_cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Notifications
                  </h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {notifications ? (
                      <CheckCircle className="h-4 w-4 text-apricot-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-jasper-400" />
                    )}
                    <span className="text-sm text-dark_cyan-400">
                      {notifications ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="text-xs text-dark_cyan-500">
                    Desktop notifications
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Audio Settings */}
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-tangerine-500/20">
                  {soundEnabled ? (
                    <Volume2 className="h-6 w-6 text-tangerine-400" />
                  ) : (
                    <VolumeX className="h-6 w-6 text-tangerine-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Audio Settings
                  </h3>
                  <p className="text-sm text-dark_cyan-400">
                    Control sound effects and audio feedback
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20">
                  <div>
                    <div className="text-sm font-medium text-white mb-1">
                      Sound Effects
                    </div>
                    <div className="text-xs text-dark_cyan-400">
                      Play sounds for interactions and notifications
                    </div>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      soundEnabled ? "bg-tangerine-500" : "bg-dark_cyan-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        soundEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* General Settings */}
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-apricot-500/20">
                  <Save className="h-6 w-6 text-apricot-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    General Settings
                  </h3>
                  <p className="text-sm text-dark_cyan-400">
                    Configure application behavior and preferences
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20">
                  <div>
                    <div className="text-sm font-medium text-white mb-1">
                      Auto-save
                    </div>
                    <div className="text-xs text-dark_cyan-400">
                      Automatically save your work as you type
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoSave(!autoSave)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoSave ? "bg-tangerine-500" : "bg-dark_cyan-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoSave ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20">
                  <div>
                    <div className="text-sm font-medium text-white mb-1">
                      Desktop Notifications
                    </div>
                    <div className="text-xs text-dark_cyan-400">
                      Show system notifications for important events
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications ? "bg-tangerine-500" : "bg-dark_cyan-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Project Settings */}
            {project && onRenameProject && (
              <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-dark_cyan-500/20">
                    <Edit3 className="h-6 w-6 text-dark_cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Project Settings
                    </h3>
                    <p className="text-sm text-dark_cyan-400">
                      Manage project-specific configurations
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-dark_cyan-300 bg-opacity-10 border border-dark_cyan-200 border-opacity-20">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">
                          Rename Project
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          Change the name of "{project.name}"
                        </div>
                      </div>
                      <Button
                        onClick={onRenameProject}
                        size="sm"
                        variant="outline"
                        icon={<Edit3 className="h-4 w-4" />}
                      >
                        Rename
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Settings */}
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-jasper-500/20">
                  <Settings className="h-6 w-6 text-jasper-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Advanced Settings
                  </h3>
                  <p className="text-sm text-dark_cyan-400">
                    Developer and system configurations
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-lg bg-dark_cyan-500/10 border border-dark_cyan-200/20 text-center">
                  <Settings className="h-12 w-12 text-dark_cyan-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">
                    Coming Soon
                  </h4>
                  <p className="text-sm text-dark_cyan-400 mb-4">
                    Advanced configuration options will be available here.
                  </p>
                  <p className="text-xs text-dark_cyan-500">
                    This section will include developer settings, API
                    configurations, and other advanced options.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
