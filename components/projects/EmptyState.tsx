"use client";

import { Database, Plus } from "lucide-react";
import Button from "../ui/Button";

interface EmptyStateProps {
  onNewProject: () => void;
}

export default function EmptyState({ onNewProject }: EmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="animate-float mb-8">
          <div className="mx-auto h-20 w-20 card rounded-2xl flex items-center justify-center">
            <Database className="h-10 w-10 text-white text-opacity-80" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">
          Welcome to <span className="gradient-text">Manifold</span>
        </h2>
        <p className="text-body text-white text-opacity-80 mb-8">
          Start by creating a new project to consolidate data from multiple
          sources. Import CSV files, SQL dumps, or create custom scripts to pull
          data from APIs.
        </p>
        <Button
          onClick={onNewProject}
          size="lg"
          icon={<Plus className="h-5 w-5" />}
        >
          Create Your First Project
        </Button>
      </div>
    </div>
  );
}
