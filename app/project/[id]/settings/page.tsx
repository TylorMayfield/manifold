"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project } from "../../../../types";
import { clientDatabaseService } from "../../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../../lib/utils/ClientLogger";
import Button from "../../../../components/ui/Button";
import RenameProjectModal from "../../../../components/projects/RenameProjectModal";
import {
  ArrowLeft,
  Settings,
  Edit3,
  Trash2,
  Database,
  Clock,
  User,
  Shield,
  Bell,
  Volume2,
  VolumeX,
  Save,
  Download,
  Upload,
  Key,
  Globe,
  Code,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const handleProjectRenamed = (updatedProject: Project) => {
    setProject(updatedProject);
    clientLogger.success("Project renamed successfully", "user-action", {
      projectId: updatedProject.id,
      newName: updatedProject.name,
    });
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    if (
      confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await dbService.deleteProject(projectId);
        clientLogger.success("Project deleted successfully", "user-action", {
          projectId,
          projectName: project.name,
        });
        router.push("/");
      } catch (error) {
        clientLogger.error("Failed to delete project", "user-action", {
          error,
          projectId,
        });
      }
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Save settings logic here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate save

      clientLogger.success("Settings saved successfully", "user-action", {
        projectId,
        settings: { soundEnabled, notifications, autoSave },
      });
    } catch (error) {
      clientLogger.error("Failed to save settings", "user-action", {
        error,
        projectId,
      });
    } finally {
      setSaving(false);
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-dark_cyan-200 border-opacity-10">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push(`/project/${projectId}`)}
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Project
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-tangerine-500/20">
              <Settings className="h-5 w-5 text-tangerine-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Project Settings
              </h1>
              <p className="text-dark_cyan-400">
                {project?.name} - Configuration and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saving && (
            <div className="flex items-center gap-2 text-yellow-400">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Saving...</span>
            </div>
          )}

          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            icon={<Save className="h-4 w-4" />}
          >
            Save Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-dark_cyan-100 bg-opacity-20 border-r border-dark_cyan-200 border-opacity-10 flex flex-col">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Settings</h3>
            <nav className="space-y-1">
              {[
                { id: "general", label: "General", icon: Settings },
                { id: "project", label: "Project Info", icon: Database },
                { id: "preferences", label: "Preferences", icon: User },
                { id: "security", label: "Security", icon: Shield },
                { id: "integrations", label: "Integrations", icon: Globe },
                { id: "advanced", label: "Advanced", icon: Code },
                { id: "danger", label: "Danger Zone", icon: AlertTriangle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                    activeTab === id
                      ? "bg-tangerine-500/20 text-tangerine-400"
                      : "text-dark_cyan-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-tangerine-400" />
                  General Settings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Auto-save
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          Automatically save changes
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
                          Show system notifications
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications(!notifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notifications
                            ? "bg-tangerine-500"
                            : "bg-dark_cyan-300"
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

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Sound Effects
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          Play sounds for interactions
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
              </div>

              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-400" />
                  Performance
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-dark_cyan-400 mb-1">
                      Cache Size
                    </div>
                    <div className="text-white font-medium">2.4 MB</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-dark_cyan-400 mb-1">
                      Memory Usage
                    </div>
                    <div className="text-white font-medium">156 MB</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white/5">
                    <div className="text-sm text-dark_cyan-400 mb-1">
                      Last Optimized
                    </div>
                    <div className="text-white font-medium">2 hours ago</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "project" && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Database className="h-5 w-5 text-tangerine-400" />
                  Project Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Project Name
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-white">{project?.name}</span>
                        </div>
                        <Button
                          onClick={() => setShowRenameModal(true)}
                          variant="outline"
                          size="sm"
                          icon={<Edit3 className="h-4 w-4" />}
                        >
                          Rename
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Project ID
                      </label>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-dark_cyan-400 font-mono text-sm">
                          {project?.id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Description
                      </label>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-dark_cyan-400">
                          {project?.description || "No description provided"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Created
                      </label>
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-dark_cyan-400">
                          {project?.createdAt
                            ? new Date(project.createdAt).toLocaleDateString()
                            : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-apricot-400" />
                  User Preferences
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3">
                      Theme
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {["Dark", "Light", "Auto"].map((theme) => (
                        <button
                          key={theme}
                          className="p-3 rounded-lg border border-white/10 hover:border-tangerine-500/50 transition-colors text-center"
                        >
                          <div className="text-sm text-white">{theme}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-white mb-3">
                      Language
                    </h3>
                    <select className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-400" />
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        Data Encryption
                      </div>
                      <div className="text-xs text-dark_cyan-400">
                        Encrypt sensitive data at rest
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-green-400">Enabled</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        API Access
                      </div>
                      <div className="text-xs text-dark_cyan-400">
                        Allow external API access
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-red-400">Disabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-400" />
                  Integrations
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Database className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          MySQL
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          Database connection
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-green-400">Connected</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Globe className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">
                          REST API
                        </div>
                        <div className="text-xs text-dark_cyan-400">
                          External API access
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <span className="text-xs text-red-400">
                        Not configured
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Code className="h-5 w-5 text-purple-400" />
                  Advanced Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Debug Mode
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-white/10 text-tangerine-500 focus:ring-tangerine-500"
                      />
                      <span className="text-sm text-dark_cyan-400">
                        Enable detailed logging
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Cache Duration (minutes)
                    </label>
                    <input
                      type="number"
                      defaultValue="30"
                      className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="space-y-6">
              <div className="glass-card p-6 border border-red-500/20">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  Danger Zone
                </h2>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">
                      Delete Project
                    </h3>
                    <p className="text-dark_cyan-400 mb-4">
                      Permanently delete this project and all its data. This
                      action cannot be undone.
                    </p>
                    <Button
                      onClick={handleDeleteProject}
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                      icon={<Trash2 className="h-4 w-4" />}
                    >
                      Delete Project
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rename Project Modal */}
      {showRenameModal && (
        <RenameProjectModal
          isOpen={showRenameModal}
          onClose={() => setShowRenameModal(false)}
          project={project}
          onProjectRenamed={handleProjectRenamed}
        />
      )}
    </div>
  );
}
