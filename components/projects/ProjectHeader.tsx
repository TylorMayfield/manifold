"use client";

import { Project } from "../../types";
import { ArrowLeft, Settings } from "lucide-react";
import Button from "../ui/Button";

interface ProjectHeaderProps {
  project: Project;
  onBack: () => void;
  onSettings: () => void;
}

export default function ProjectHeader({
  project,
  onBack,
  onSettings,
}: ProjectHeaderProps) {
  return (
    <div className="p-6 border-b border-white border-opacity-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mr-4 button-interactive"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-white text-opacity-80 mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={onSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
