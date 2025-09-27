"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project, DataSource } from "../../../types";
import { clientDatabaseService } from "../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../lib/utils/ClientLogger";
import Button from "../../../components/ui/Button";
import {
  Database,
  Zap,
  Network,
  Code,
  Plus,
  ArrowRight,
  BarChart3,
  Settings,
  Clock,
  TrendingUp,
  Activity,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;

  const [project, setProject] = useState<Project | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
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
        const loadedDataSources = await dbService.getDataSources(projectId);
        setDataSources(loadedDataSources);
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
      {/* Main Content Grid - Optimized for Desktop */}
      <div className="flex-1 grid grid-cols-12 grid-rows-6 gap-6 p-6">
        {/* Left Column - Project Stats & Quick Actions */}
        <div className="col-span-5 row-span-6 flex flex-col gap-6">
          {/* Project Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Data Sources Card */}
            <div
              className="glass-card p-4 hover:bg-white/5 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${projectId}/data-sources`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-tangerine-500/20 group-hover:bg-tangerine-500/30 transition-colors">
                  <Database className="h-4 w-4 text-tangerine-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-dark_cyan-400 group-hover:text-tangerine-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {dataSources.length}
              </div>
              <div className="text-xs text-dark_cyan-400">Data Sources</div>
            </div>

            {/* Workflows Card */}
            <div
              className="glass-card p-4 hover:bg-white/5 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${projectId}/workflows`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-apricot-500/20 group-hover:bg-apricot-500/30 transition-colors">
                  <Zap className="h-4 w-4 text-apricot-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-dark_cyan-400 group-hover:text-apricot-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">0</div>
              <div className="text-xs text-dark_cyan-400">Workflows</div>
            </div>

            {/* Models Card */}
            <div
              className="glass-card p-4 hover:bg-white/5 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${projectId}/models`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-jasper-500/20 group-hover:bg-jasper-500/30 transition-colors">
                  <Network className="h-4 w-4 text-jasper-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-dark_cyan-400 group-hover:text-jasper-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">0</div>
              <div className="text-xs text-dark_cyan-400">Models</div>
            </div>

            {/* SQL Editor Card */}
            <div
              className="glass-card p-4 hover:bg-white/5 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${projectId}/sql-editor`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Code className="h-4 w-4 text-blue-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-dark_cyan-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">—</div>
              <div className="text-xs text-dark_cyan-400">SQL Editor</div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card p-6 flex-1">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-tangerine-400" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Button
                onClick={() =>
                  router.push(`/project/${projectId}/add-data-source`)
                }
                variant="outline"
                className="w-full justify-start h-12 text-left"
                icon={<Database className="h-4 w-4" />}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">Add Data Source</span>
                  <span className="text-xs text-dark_cyan-400">
                    Connect new data
                  </span>
                </div>
              </Button>

              <Button
                onClick={() =>
                  router.push(`/project/${projectId}/workflows/new`)
                }
                variant="outline"
                className="w-full justify-start h-12 text-left"
                icon={<Zap className="h-4 w-4" />}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">Create Workflow</span>
                  <span className="text-xs text-dark_cyan-400">
                    Automate processes
                  </span>
                </div>
              </Button>

              <Button
                onClick={() =>
                  router.push(`/project/${projectId}/models/build`)
                }
                variant="outline"
                className="w-full justify-start h-12 text-left"
                icon={<Network className="h-4 w-4" />}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">Build Model</span>
                  <span className="text-xs text-dark_cyan-400">
                    Create data models
                  </span>
                </div>
              </Button>

              <Button
                onClick={() => router.push(`/project/${projectId}/sql-editor`)}
                variant="outline"
                className="w-full justify-start h-12 text-left"
                icon={<Code className="h-4 w-4" />}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">SQL Editor</span>
                  <span className="text-xs text-dark_cyan-400">
                    Query your data
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Center Column - Data Sources & Activity */}
        <div className="col-span-7 row-span-6 flex flex-col gap-6">
          {/* Data Sources List */}
          <div className="glass-card p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Database className="h-5 w-5 text-tangerine-400" />
                Data Sources
              </h3>
              <Button
                onClick={() =>
                  router.push(`/project/${projectId}/add-data-source`)
                }
                size="sm"
                icon={<Plus className="h-4 w-4" />}
              >
                Add Source
              </Button>
            </div>

            {dataSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Database className="h-12 w-12 text-dark_cyan-400 mb-3 opacity-50" />
                <p className="text-dark_cyan-400 mb-2">
                  No data sources connected
                </p>
                <p className="text-sm text-dark_cyan-500">
                  Add your first data source to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {dataSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() =>
                      router.push(`/project/${projectId}/data-sources`)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-tangerine-500/20">
                        <Database className="h-4 w-4 text-tangerine-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {source.name}
                        </div>
                        <div className="text-xs text-dark_cyan-400 capitalize">
                          {source.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-dark_cyan-400">
                        0 records
                      </div>
                      <ArrowRight className="h-4 w-4 text-dark_cyan-400 group-hover:text-tangerine-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="glass-card p-6 flex-1">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-apricot-400" />
              Recent Activity
            </h3>
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Clock className="h-12 w-12 text-dark_cyan-400 mb-3 opacity-50" />
              <p className="text-dark_cyan-400 mb-2">No recent activity</p>
              <p className="text-sm text-dark_cyan-500">
                Activity will appear here as you work
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
