"use client";

import { useState } from "react";
import { X, Volume2, VolumeX, Cloud, Download, Edit3 } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { Project } from "../../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackupRestore?: () => void;
  onRenameProject?: () => void;
  project?: Project | null;
}

export default function SettingsModal({
  isOpen,
  onClose,
  onBackupRestore,
  onRenameProject,
  project,
}: SettingsModalProps) {
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
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" size="lg">
      <div className="space-y-6">
        {/* Audio Settings */}
        <div className="space-y-4">
          <div className="flex items-center">
            {soundEnabled ? (
              <Volume2 className="h-5 w-5 text-dark_cyan-400 mr-3" />
            ) : (
              <VolumeX className="h-5 w-5 text-dark_cyan-400 mr-3" />
            )}
            <h3 className="text-lg font-semibold text-white">Audio</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">
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

        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">General</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">Auto-save</div>
                <div className="text-xs text-dark_cyan-400">
                  Automatically save your work
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

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">
                  Notifications
                </div>
                <div className="text-xs text-dark_cyan-400">
                  Show desktop notifications
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

        {/* Project Management Section */}
        {project && (
          <div className="card p-4">
            <div className="flex items-center mb-4">
              <Edit3 className="h-5 w-5 text-white mr-3" />
              <h3 className="text-lg font-semibold text-white">
                Project Management
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
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
        )}

        {/* Backup & Restore Section */}
        {onBackupRestore && (
          <div className="card p-4">
            <div className="flex items-center mb-4">
              <Cloud className="h-5 w-5 text-dark_cyan-400 mr-3" />
              <h3 className="text-lg font-semibold text-white">
                Backup & Restore
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
                    Data Backup
                  </div>
                  <div className="text-xs text-dark_cyan-400">
                    Backup and restore your projects and data
                  </div>
                </div>
                <Button
                  onClick={onBackupRestore}
                  size="sm"
                  variant="outline"
                  icon={<Download className="h-4 w-4" />}
                >
                  Manage
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-dark_cyan-200 border-opacity-20">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </Modal>
  );
}
