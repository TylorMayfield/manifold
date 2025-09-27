"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Project, DataSource } from "../../../../types";
import { clientDatabaseService } from "../../../../lib/database/ClientDatabaseService";
import { clientLogger } from "../../../../lib/utils/ClientLogger";
import Button from "../../../../components/ui/Button";
import SqlEditor from "../../../../components/editor/SqlEditor";
import { ArrowLeft, Code } from "lucide-react";

export default function SqlEditorPage() {
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
              <Code className="h-5 w-5 text-tangerine-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">SQL Editor</h1>
              <p className="text-dark_cyan-400">
                {project?.name} - Write and execute SQL queries against your
                data sources
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-dark_cyan-400">
            {dataSources.length} data source
            {dataSources.length !== 1 ? "s" : ""} available
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <SqlEditor
          isOpen={true}
          onClose={() => {}}
          dataSources={dataSources}
          projectId={projectId}
        />
      </div>
    </div>
  );
}
