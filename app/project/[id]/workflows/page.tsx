"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project } from "../../../../types";
import { clientDatabaseService } from "../../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../../lib/utils/ClientLogger";
import Button from "../../../../components/ui/Button";
import { ArrowLeft, Plus, Zap, Play, Settings, Eye, Download, Database, Server, BarChart3, Clock, CheckCircle } from "lucide-react";
import "../../../workflow-styles.css";

export default function WorkflowsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
      clientLogger.error("Failed to load project", "database", { projectId, error });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center gradient-bg">
        <div className="native-loading-spinner">
          <div className="text-white text-lg">Loading workflows...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center gradient-bg">
        <div className="native-error-state">
          <div className="text-white text-lg">Project not found</div>
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="mt-4"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col gradient-bg">
      {/* macOS-style Header */}
      <div className="native-titlebar flex items-center justify-between px-6 py-4 relative">
        <div className="flex items-center gap-4">
          {/* macOS Traffic Lights */}
          <div className="macos-traffic-lights">
            <div className="traffic-light traffic-light-close" title="Close" />
            <div className="traffic-light traffic-light-minimize" title="Minimize" />
            <div className="traffic-light traffic-light-maximize" title="Maximize" />
          </div>
          
          <Button
            onClick={() => router.push(`/project/${projectId}`)}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Project
          </Button>
          
          <div className="macos-separator w-px" />
          
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-tangerine-400" />
            <div>
              <h1 className="text-xl font-semibold text-white">Workflows</h1>
              <p className="text-xs text-white/60">
                Data transformation and automation
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-white/60">
            {project.name}
          </div>
          <div className="macos-separator w-px" />
          <div className="macos-status-indicator active">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span>Connected</span>
          </div>
          <Button
            onClick={() => router.push(`/project/${projectId}/workflows/new`)}
            className="bg-tangerine-500/20 hover:bg-tangerine-500/30 text-tangerine-400 border-tangerine-500/30"
            icon={<Plus className="h-4 w-4" />}
          >
            New Workflow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden macos-content">
        <div className="h-full flex flex-col p-6 space-y-6 macos-slide-up">

          {/* Overview Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="native-panel p-6 macos-bounce-in" style={{animationDelay: '0.1s'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-tangerine-500/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-tangerine-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/80">Active</h3>
                  <p className="text-2xl font-bold text-tangerine-400">0</p>
                </div>
              </div>
              <p className="text-xs text-white/50">
                Currently running
              </p>
            </div>

            <div className="native-panel p-6 macos-bounce-in" style={{animationDelay: '0.2s'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-apricot-500/20 flex items-center justify-center">
                  <Play className="h-5 w-5 text-apricot-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/80">Executions</h3>
                  <p className="text-2xl font-bold text-apricot-400">0</p>
                </div>
              </div>
              <p className="text-xs text-white/50">
                This month
              </p>
            </div>

            <div className="native-panel p-6 macos-bounce-in" style={{animationDelay: '0.3s'}}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-jasper-500/20 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-jasper-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white/80">Templates</h3>
                  <p className="text-2xl font-bold text-jasper-400">5</p>
                </div>
              </div>
              <p className="text-xs text-white/50">
                Available
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="native-panel p-6 macos-bounce-in" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-dark_cyan-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-dark_cyan-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Quick Start</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => router.push(`/project/${projectId}/workflows/new`)}
                className="native-button-card p-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-tangerine-500/20 flex items-center justify-center mb-3">
                  <Plus className="h-5 w-5 text-tangerine-400" />
                </div>
                <div className="font-medium text-white text-sm">Create Workflow</div>
                <div className="text-xs text-white/50 mt-1">Start from scratch</div>
              </button>

              <button
                onClick={() => router.push(`/project/${projectId}/workflows/new?template=data-pipeline`)}
                className="native-button-card p-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-apricot-500/20 flex items-center justify-center mb-3">
                  <Database className="h-5 w-5 text-apricot-400" />
                </div>
                <div className="font-medium text-white text-sm">Data Pipeline</div>
                <div className="text-xs text-white/50 mt-1">ETL template</div>
              </button>

              <button
                onClick={() => router.push(`/project/${projectId}/workflows/new?template=api-sync`)}
                className="native-button-card p-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-jasper-500/20 flex items-center justify-center mb-3">
                  <Server className="h-5 w-5 text-jasper-400" />
                </div>
                <div className="font-medium text-white text-sm">API Sync</div>
                <div className="text-xs text-white/50 mt-1">Real-time sync</div>
              </button>

              <button
                onClick={() => router.push(`/project/${projectId}/workflows/new?template=analytics`)}
                className="native-button-card p-4 text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-dark_cyan-500/20 flex items-center justify-center mb-3">
                  <BarChart3 className="h-5 w-5 text-dark_cyan-400" />
                </div>
                <div className="font-medium text-white text-sm">Analytics</div>
                <div className="text-xs text-white/50 mt-1">Data processing</div>
              </button>
            </div>
          </div>

          {/* Recent Workflows */}
          <div className="flex-1 native-panel p-6 min-h-0 macos-bounce-in" style={{animationDelay: '0.5s'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-tangerine-500/20 flex items-center justify-center">
                  <Eye className="h-4 w-4 text-tangerine-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Recent Workflows</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/60 hover:text-white hover:bg-white/10"
                  icon={<Download className="h-4 w-4" />}
                >
                  Export
                </Button>
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-dark_cyan-500/20 flex items-center justify-center mb-4 mx-auto">
                  <Zap className="w-8 h-8 text-dark_cyan-400" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">No workflows yet</h3>
                <p className="text-white/50 text-sm mb-6">
                  Create your first workflow to start transforming your data
                </p>
                <Button
                  onClick={() => router.push(`/project/${projectId}/workflows/new`)}
                  className="bg-tangerine-500/20 hover:bg-tangerine-500/30 text-tangerine-400 border-tangerine-500/30"
                  icon={<Plus className="h-4 w-4" />}
                >
                  Create Your First Workflow
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
