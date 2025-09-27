"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project, DataSource } from "../../../../types";
import { clientDatabaseService } from "../../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../../lib/utils/ClientLogger";
import Button from "../../../../components/ui/Button";
import ConsolidatedModelBuilder from "../../../../components/model/ConsolidatedModelBuilder";
import ComplexRelationshipBuilder from "../../../../components/model/ComplexRelationshipBuilder";
import { ArrowLeft, ArrowRight, Plus, Network, GitBranch } from "lucide-react";

export default function ModelsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const dbService = clientDatabaseService;

  const [project, setProject] = useState<Project | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBuilder, setActiveBuilder] = useState<"simple" | "complex">(
    "simple"
  );

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
    <div className="max-w-7xl mx-auto p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push(`/project/${projectId}`)}
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Project
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Data Models</h1>
            <p className="text-dark_cyan-400">
              Build and manage data relationships and models
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/project/${projectId}/models/new`)}
          icon={<Plus className="h-4 w-4" />}
        >
          New Model
        </Button>
      </div>

      {/* Model Builder Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Model Builder</h2>
          <Button
            onClick={() => router.push(`/project/${projectId}/models/build`)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Build New Model
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="glass-card p-6 cursor-pointer hover:bg-white/5 transition-all"
            onClick={() => router.push(`/project/${projectId}/models/build`)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-tangerine-500/20">
                <Network className="h-5 w-5 text-tangerine-400" />
              </div>
              <h3 className="font-medium text-white">
                Consolidated Model Builder
              </h3>
            </div>
            <p className="text-dark_cyan-300 text-sm mb-4">
              Create unified models by combining multiple data sources with
              intelligent relationship detection.
            </p>
            <div className="flex items-center text-xs text-dark_cyan-400">
              <span>Step-by-step workflow</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </div>

          <div
            className="glass-card p-6 cursor-pointer hover:bg-white/5 transition-all"
            onClick={() => setActiveBuilder("complex")}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <GitBranch className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="font-medium text-white">
                Complex Relationship Builder
              </h3>
            </div>
            <p className="text-dark_cyan-300 text-sm mb-4">
              Advanced relationship modeling with visual graph interface for
              complex data structures.
            </p>
            <div className="flex items-center text-xs text-dark_cyan-400">
              <span>Visual relationship mapping</span>
              <ArrowRight className="h-3 w-3 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Complex Relationship Builder (when selected) */}
      {activeBuilder === "complex" && (
        <div className="glass-card p-6">
          <ComplexRelationshipBuilder
            isOpen={true}
            onClose={() => setActiveBuilder("simple")}
            dataSources={dataSources}
            projectId={projectId}
          />
        </div>
      )}
    </div>
  );
}
