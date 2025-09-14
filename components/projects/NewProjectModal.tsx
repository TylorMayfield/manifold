import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import { Project } from "../../types";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const project: Project = {
        id: uuidv4(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        dataPath: `/projects/${formData.name
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")}`,
      };

      await onCreateProject(project);

      // Reset form
      setFormData({ name: "", description: "" });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      setErrors({ general: "Failed to create project. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        {errors.general && (
          <div className="mb-6 p-4 card border border-red-400/30 rounded-xl">
            <p className="text-sm text-red-300">{errors.general}</p>
          </div>
        )}

        <div className="space-y-6">
          <Input
            label="Project Name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Enter project name"
            error={errors.name}
            required
          />

          <Textarea
            label="Description (Optional)"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe what this project is for..."
            rows={3}
            error={errors.description}
          />
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewProjectModal;
