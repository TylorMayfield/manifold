"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project, DataSource } from "../../../types";
import { clientDatabaseService } from "../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../lib/utils/ClientLogger";
import PageLayout from "../../../components/layout/PageLayout";
import CellButton from "../../../components/ui/CellButton";
import CellCard from "../../../components/ui/CellCard";
import LoadingSpinner from "../../../components/ui/LoadingSpinner";
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
      <PageLayout
        title="Project Overview"
        subtitle="Loading project details..."
        icon={BarChart3}
        showBackButton={true}
      >
        <LoadingSpinner />
      </PageLayout>
    );
  }

  if (!project) {
    return (
      <PageLayout
        title="Project Overview"
        subtitle="Project not found"
        icon={BarChart3}
        showBackButton={true}
      >
        <CellCard className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-heading mb-2">Project Not Found</h2>
          <p className="text-body text-gray-600">
            The project you're looking for could not be found.
          </p>
        </CellCard>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={project.name}
      subtitle="Project overview and quick actions"
      icon={BarChart3}
      showBackButton={true}
      headerActions={
        <CellButton
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/project/${projectId}/settings`)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </CellButton>
      }
    >
      {/* Main Content Grid - Dashboard Style */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Project Stats & Quick Actions */}
        <div className="col-span-5 flex flex-col gap-6">
          {/* Project Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Data Sources Card */}
            <CellCard
              className="p-4 hover:bg-gray-50 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${projectId}/data-sources`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                  <Database className="h-4 w-4 text-orange-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <div className="text-heading font-mono mb-1">
                {dataSources.length}
              </div>
              <div className="text-caption text-gray-600">Data Sources</div>
            </CellCard>

            {/* Workflows Card */}
            <CellCard
              className="p-4 hover:bg-gray-50 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${projectId}/workflows`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-yellow-100 group-hover:bg-yellow-200 transition-colors">
                  <Zap className="h-4 w-4 text-yellow-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-yellow-600 transition-colors" />
              </div>
              <div className="text-heading font-mono mb-1">0</div>
              <div className="text-caption text-gray-600">Workflows</div>
            </CellCard>

            {/* Models Card */}
            <CellCard
              className="p-4 hover:bg-gray-50 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${projectId}/models`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                  <Network className="h-4 w-4 text-red-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-red-600 transition-colors" />
              </div>
              <div className="text-heading font-mono mb-1">0</div>
              <div className="text-caption text-gray-600">Models</div>
            </CellCard>

            {/* SQL Editor Card */}
            <CellCard
              className="p-4 hover:bg-gray-50 transition-all cursor-pointer group"
              onClick={() => router.push(`/project/${projectId}/sql-editor`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Code className="h-4 w-4 text-blue-600" />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="text-heading font-mono mb-1">—</div>
              <div className="text-caption text-gray-600">SQL Editor</div>
            </CellCard>
          </div>

          {/* Quick Actions Panel */}
          <CellCard className="p-6 flex-1">
            <h3 className="text-subheading font-bold mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-gray-600" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              <CellButton
                onClick={() =>
                  router.push(`/project/${projectId}/add-data-source`)
                }
                variant="outline"
                className="w-full justify-start h-12"
              >
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-bold">Add Data Source</div>
                    <div className="text-caption text-gray-600">
                      Connect new data
                    </div>
                  </div>
                </div>
              </CellButton>

              <CellButton
                onClick={() =>
                  router.push(`/project/${projectId}/workflows/new`)
                }
                variant="outline"
                className="w-full justify-start h-12"
              >
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-bold">Create Workflow</div>
                    <div className="text-caption text-gray-600">
                      Automate processes
                    </div>
                  </div>
                </div>
              </CellButton>

              <CellButton
                onClick={() =>
                  router.push(`/project/${projectId}/models/build`)
                }
                variant="outline"
                className="w-full justify-start h-12"
              >
                <div className="flex items-center gap-3">
                  <Network className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-bold">Build Model</div>
                    <div className="text-caption text-gray-600">
                      Create data models
                    </div>
                  </div>
                </div>
              </CellButton>

              <CellButton
                onClick={() => router.push(`/project/${projectId}/sql-editor`)}
                variant="outline"
                className="w-full justify-start h-12"
              >
                <div className="flex items-center gap-3">
                  <Code className="h-4 w-4" />
                  <div className="text-left">
                    <div className="font-bold">SQL Editor</div>
                    <div className="text-caption text-gray-600">
                      Query your data
                    </div>
                  </div>
                </div>
              </CellButton>
            </div>
          </CellCard>
        </div>

        {/* Right Column - Data Sources & Activity */}
        <div className="col-span-7 flex flex-col gap-6">
          {/* Data Sources List */}
          <CellCard className="p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-subheading font-bold flex items-center gap-2">
                <Database className="h-5 w-5 text-gray-600" />
                Data Sources
              </h3>
              <CellButton
                onClick={() =>
                  router.push(`/project/${projectId}/add-data-source`)
                }
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </CellButton>
            </div>

            {dataSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <Database className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-body mb-2">
                  No data sources connected
                </p>
                <p className="text-caption text-gray-600">
                  Add your first data source to get started
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {dataSources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group"
                    onClick={() =>
                      router.push(`/project/${projectId}/data-sources`)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100">
                        <Database className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {source.name}
                        </div>
                        <div className="text-caption text-gray-600 capitalize">
                          {source.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-caption text-gray-600">
                        0 records
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CellCard>

          {/* Recent Activity */}
          <CellCard className="p-6 flex-1">
            <h3 className="text-subheading font-bold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              Recent Activity
            </h3>
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Clock className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-body mb-2">No recent activity</p>
              <p className="text-caption text-gray-600">
                Activity will appear here as you work
              </p>
            </div>
          </CellCard>
        </div>
      </div>
    </PageLayout>
  );
}
