"use client";

import React, { useState, useEffect } from "react";
import { Edit3, Save, X, AlertCircle } from "lucide-react";
import { logger } from "../../lib/utils/logger";
import { Project } from "../../types";
import { DatabaseService } from "../../lib/services/DatabaseService";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface RenameProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onProjectRenamed: (updatedProject: Project) => void;
}

export default function RenameProjectModal({
  isOpen,
  onClose,
  project,
  onProjectRenamed,
}: RenameProjectModalProps) {
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const dbService = DatabaseService.getInstance();

  useEffect(() => {
    if (isOpen && project) {
      setNewName(project.name);
      setError(null);
      setIsValid(true);
    }
  }, [isOpen, project]);

  useEffect(() => {
    // Validate the new name
    const trimmed = newName.trim();
    const valid = trimmed.length > 0 && trimmed !== project.name;
    setIsValid(valid);

    if (trimmed.length === 0) {
      setError("Project name cannot be empty");
    } else if (trimmed === project.name) {
      setError("Please enter a different name");
    } else if (trimmed.length > 100) {
      setError("Project name must be 100 characters or less");
    } else {
      setError(null);
    }
  }, [newName, project.name]);

  const handleSave = async () => {
    if (!isValid || loading) return;

    try {
      setLoading(true);
      setError(null);

      const trimmedName = newName.trim();

      // Check if a project with this name already exists
      const existingProjects = await dbService.getProjects();
      const nameExists = existingProjects.some(
        (p) =>
          p.id !== project.id &&
          p.name.toLowerCase() === trimmedName.toLowerCase()
      );

      if (nameExists) {
        setError("A project with this name already exists");
        return;
      }

      // Update the project
      const updatedProject: Project = {
        ...project,
        name: trimmedName,
        updatedAt: new Date(),
      };

      await dbService.updateProjectObject(updatedProject);

      logger.success(
        "Project renamed successfully",
        "user-action",
        {
          projectId: project.id,
          oldName: project.name,
          newName: trimmedName,
        },
        "RenameProjectModal"
      );

      onProjectRenamed(updatedProject);
      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to rename project"
      );
      logger.error(
        "Failed to rename project",
        "user-action",
        {
          error,
          projectId: project.id,
          newName: newName.trim(),
        },
        "RenameProjectModal"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isValid && !loading) {
      handleSave();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename Project" size="md">
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-medium">Error</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Current Name
          </label>
          <div className="p-3 rounded-lg bg-white/5 border border-white/20 text-white/60">
            {project.name}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            New Name
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Enter new project name"
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            maxLength={100}
            disabled={loading}
          />
          <p className="text-white/50 text-xs mt-1">
            {newName.length}/100 characters
          </p>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            loading={loading}
            disabled={!isValid}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Rename Project
          </Button>
        </div>
      </div>
    </Modal>
  );
}
