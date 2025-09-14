"use client";

import { Project } from "../../types";
import { FolderOpen } from "lucide-react";
import Button from "../ui/Button";
import useViewTransition from "../../hooks/useViewTransition";

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onNewProject: () => void;
}

export default function ProjectGrid({
  projects,
  onProjectClick,
  onNewProject,
}: ProjectGridProps) {
  const { transitionElement } = useViewTransition();

  const handleProjectClick = async (project: Project, element: HTMLElement) => {
    await transitionElement(element, () => onProjectClick(project), {
      type: "zoom",
      duration: 200,
      name: `project-${project.id}`,
    });
  };
  return (
    <div className="animate-slide-in">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Your Projects</h2>
        <Button
          onClick={onNewProject}
          icon={<FolderOpen className="h-4 w-4" />}
          className="button-interactive"
        >
          New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project, index) => (
          <div
            key={project.id}
            onClick={(e) => handleProjectClick(project, e.currentTarget)}
            className={`card-interactive rounded-xl p-5 group ${
              index % 2 === 0 ? "animate-float" : "animate-float-delayed"
            }`}
          >
            <div className="flex items-center mb-3">
              <div className="p-2 rounded-lg btn-primary mr-3 group-hover:scale-110 transition-transform duration-200">
                <FolderOpen className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {project.name}
                </h3>
                <p className="text-xs text-white text-opacity-60">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {project.description && (
              <p className="text-sm text-white text-opacity-80 mb-3 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="flex justify-between items-center text-xs text-white text-opacity-60">
              <span>
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </span>
              <span className="text-white text-opacity-80 group-hover:text-white transition-colors duration-200">
                Open →
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
