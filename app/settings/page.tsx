"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../components/ui/Button";
import { useSettings } from "../../contexts/SettingsContext";
import {
  Settings,
  User,
  Database,
  Bell,
  Shield,
  HardDrive,
  Palette,
  Globe,
  Key,
  Download,
  Upload,
  RefreshCw,
  Save,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("general");
  const [showApiKey, setShowApiKey] = useState(false);
  const {
    settings,
    loading,
    error,
    hasUnsavedChanges,
    updateSetting,
    saveSettings,
  } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const sections: SettingSection[] = [
    {
      id: "general",
      title: "General",
      description: "Application settings and preferences",
      icon: Settings,
    },
    {
      id: "database",
      title: "Database",
      description: "Data storage and backup configuration",
      icon: Database,
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Alert and notification preferences",
      icon: Bell,
    },
    {
      id: "security",
      title: "Security",
      description: "Authentication and access control",
      icon: Shield,
    },
    {
      id: "storage",
      title: "Storage",
      description: "Disk usage and cleanup settings",
      icon: HardDrive,
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "UI theme and display options",
      icon: Palette,
    },
  ];

  const handleSettingChange = (key: string, value: any) => {
    updateSetting(key as any, value);
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const success = await saveSettings();
      if (success) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings. Please try again.");
      }
    } catch (err) {
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "manifold-settings.json";
    a.click();
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Application Name
        </label>
        <input
          type="text"
          value={settings.applicationName}
          onChange={(e) =>
            handleSettingChange("applicationName", e.target.value)
          }
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-dark_cyan-500 focus:border-dark_cyan-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Default Timezone
          </label>
          <select
            value={settings.defaultTimezone}
            onChange={(e) =>
              handleSettingChange("defaultTimezone", e.target.value)
            }
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-dark_cyan-500 focus:border-dark_cyan-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Date Format
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => handleSettingChange("dateFormat", e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-dark_cyan-500 focus:border-dark_cyan-500"
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MMM DD, YYYY">MMM DD, YYYY</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Max Concurrent Jobs
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={settings.maxConcurrentJobs}
          onChange={(e) =>
            handleSettingChange("maxConcurrentJobs", parseInt(e.target.value))
          }
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
        />
        <p className="text-xs text-dark_cyan-400 mt-1">
          Maximum number of jobs that can run simultaneously
        </p>
      </div>
    </div>
  );

  const renderDatabaseSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Database Path
        </label>
        <input
          type="text"
          value={settings.databasePath}
          onChange={(e) => handleSettingChange("databasePath", e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
        />
        <p className="text-xs text-dark_cyan-400 mt-1">
          Directory where database files are stored
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="backupEnabled"
            checked={settings.backupEnabled}
            onChange={(e) =>
              handleSettingChange("backupEnabled", e.target.checked)
            }
            className="w-4 h-4"
          />
          <label htmlFor="backupEnabled" className="font-bold text-gray-900">
            Enable Automatic Backups
          </label>
        </div>

        {settings.backupEnabled && (
          <div className="ml-6 space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Backup Frequency
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) =>
                  handleSettingChange("backupFrequency", e.target.value)
                }
                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Retention Days
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.retentionDays}
                onChange={(e) =>
                  handleSettingChange("retentionDays", parseInt(e.target.value))
                }
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
              />
              <p className="text-xs text-dark_cyan-400 mt-1">
                How long to keep backup files
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="compressionEnabled"
                checked={settings.compressionEnabled}
                onChange={(e) =>
                  handleSettingChange("compressionEnabled", e.target.checked)
                }
                className="w-4 h-4"
              />
              <label htmlFor="compressionEnabled" className="text-gray-900">
                Enable Backup Compression
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="emailNotifications"
            checked={settings.emailNotifications}
            onChange={(e) =>
              handleSettingChange("emailNotifications", e.target.checked)
            }
            className="w-4 h-4"
          />
          <label
            htmlFor="emailNotifications"
            className="font-bold text-gray-900"
          >
            Enable Email Notifications
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="jobFailureNotifications"
            checked={settings.jobFailureNotifications}
            onChange={(e) =>
              handleSettingChange("jobFailureNotifications", e.target.checked)
            }
            className="w-4 h-4"
          />
          <label htmlFor="jobFailureNotifications" className="text-gray-900">
            Job Failure Notifications
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="jobCompletionNotifications"
            checked={settings.jobCompletionNotifications}
            onChange={(e) =>
              handleSettingChange(
                "jobCompletionNotifications",
                e.target.checked
              )
            }
            className="w-4 h-4"
          />
          <label htmlFor="jobCompletionNotifications" className="text-gray-900">
            Job Completion Notifications
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="systemNotifications"
            checked={settings.systemNotifications}
            onChange={(e) =>
              handleSettingChange("systemNotifications", e.target.checked)
            }
            className="w-4 h-4"
          />
          <label htmlFor="systemNotifications" className="text-gray-900">
            System Notifications
          </label>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Session Timeout (minutes)
        </label>
        <input
          type="number"
          min="5"
          max="480"
          value={settings.sessionTimeout}
          onChange={(e) =>
            handleSettingChange("sessionTimeout", parseInt(e.target.value))
          }
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
        />
        <p className="text-xs text-dark_cyan-400 mt-1">
          Automatically log out after inactivity
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="apiKeyEnabled"
            checked={settings.apiKeyEnabled}
            onChange={(e) =>
              handleSettingChange("apiKeyEnabled", e.target.checked)
            }
            className="w-4 h-4"
          />
          <label htmlFor="apiKeyEnabled" className="font-bold text-gray-900">
            Enable API Access
          </label>
        </div>

        {settings.apiKeyEnabled && (
          <div className="ml-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              API Key
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={settings.apiKey}
                  readOnly
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-black pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-2 p-1 hover:bg-gray-200 rounded"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Button size="sm" variant="outline">
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Log Level
        </label>
        <select
          value={settings.logLevel}
          onChange={(e) => handleSettingChange("logLevel", e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
        >
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
        <p className="text-xs text-dark_cyan-400 mt-1">
          Minimum level for logged messages
        </p>
      </div>
    </div>
  );

  const renderStorageSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Max Snapshot Size (MB)
        </label>
        <input
          type="number"
          min="1"
          max="1000"
          value={settings.maxSnapshotSize}
          onChange={(e) =>
            handleSettingChange("maxSnapshotSize", parseInt(e.target.value))
          }
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
        />
        <p className="text-xs text-dark_cyan-400 mt-1">
          Maximum size for individual data snapshots
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoCleanupEnabled"
            checked={settings.autoCleanupEnabled}
            onChange={(e) =>
              handleSettingChange("autoCleanupEnabled", e.target.checked)
            }
            className="w-4 h-4"
          />
          <label
            htmlFor="autoCleanupEnabled"
            className="font-bold text-gray-900"
          >
            Enable Automatic Cleanup
          </label>
        </div>

        {settings.autoCleanupEnabled && (
          <div className="ml-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Cleanup Threshold (%)
            </label>
            <input
              type="number"
              min="50"
              max="95"
              value={settings.cleanupThreshold}
              onChange={(e) =>
                handleSettingChange(
                  "cleanupThreshold",
                  parseInt(e.target.value)
                )
              }
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
            />
            <p className="text-xs text-dark_cyan-400 mt-1">
              Start cleanup when disk usage exceeds this percentage
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-dark_cyan-900 bg-opacity-50 border border-gray-300 border-opacity-20 rounded-lg">
        <h4 className="font-bold text-gray-900 mb-2">Storage Usage</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-900">Database:</span>
            <span className="text-dark_cyan-400">156 MB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-900">Snapshots:</span>
            <span className="text-dark_cyan-400">2.3 GB</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-900">Backups:</span>
            <span className="text-dark_cyan-400">890 MB</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-300 border-opacity-20">
            <span className="text-gray-900">Total:</span>
            <span className="text-dark_cyan-400">3.35 GB</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Theme
        </label>
        <div className="space-y-2">
          {["light", "dark", "auto"].map((theme) => (
            <label key={theme} className="flex items-center space-x-2">
              <input
                type="radio"
                name="theme"
                value={theme}
                checked={settings.theme === theme}
                onChange={(e) => handleSettingChange("theme", e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-gray-900 capitalize">{theme}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="compactMode"
            checked={settings.compactMode}
            onChange={(e) =>
              handleSettingChange("compactMode", e.target.checked)
            }
            className="w-4 h-4"
          />
          <label htmlFor="compactMode" className="text-gray-900">
            Compact Mode
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showLineNumbers"
            checked={settings.showLineNumbers}
            onChange={(e) =>
              handleSettingChange("showLineNumbers", e.target.checked)
            }
            className="w-4 h-4"
          />
          <label htmlFor="showLineNumbers" className="text-gray-900">
            Show Line Numbers
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Font Size
        </label>
        <select
          value={settings.fontSize}
          onChange={(e) => handleSettingChange("fontSize", e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );

  const renderSettings = () => {
    switch (activeSection) {
      case "general":
        return renderGeneralSettings();
      case "database":
        return renderDatabaseSettings();
      case "notifications":
        return renderNotificationSettings();
      case "security":
        return renderSecuritySettings();
      case "storage":
        return renderStorageSettings();
      case "appearance":
        return renderAppearanceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Home
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <Settings className="w-6 h-6 mr-3" />
                Settings
              </h1>
              <span className="text-dark_cyan-400">
                Configure your ETL environment
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {error && (
              <div className="text-red-600 text-sm mr-2">Error: {error}</div>
            )}
            {hasUnsavedChanges && (
              <div className="text-amber-600 text-sm mr-2 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Unsaved changes
              </div>
            )}
            <Button
              variant="outline"
              onClick={handleExportSettings}
              disabled={loading}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveSettings}
              disabled={!hasUnsavedChanges || isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Settings Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-dark_cyan-100 bg-opacity-20 border border-gray-300 border-opacity-10 rounded-lg p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 border border-gray-300 border-opacity-20 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? "bg-tangerine-500 bg-opacity-20 border-tangerine-400 border-opacity-30 text-gray-900"
                        : "bg-dark_cyan-100 bg-opacity-10 hover:bg-dark_cyan-100 hover:bg-opacity-20 text-gray-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-mono font-bold text-sm">
                          {section.title}
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          {section.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-dark_cyan-100 bg-opacity-20 border border-gray-300 border-opacity-10 rounded-lg p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {sections.find((s) => s.id === activeSection)?.title}
              </h2>
              <p className="text-dark_cyan-400">
                {sections.find((s) => s.id === activeSection)?.description}
              </p>
            </div>

            {renderSettings()}
          </div>
        </div>
      </div>
    </div>
  );
}
