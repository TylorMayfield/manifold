"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import CellButton from "../../ui/CellButton";
import CellInput from "../../ui/CellInput";
import CellModal from "../../ui/CellModal";

interface CreatePipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

const CreatePipelineModal: React.FC<CreatePipelineModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [newPipelineName, setNewPipelineName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!newPipelineName.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(newPipelineName.trim());
      setNewPipelineName("");
      onClose();
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setNewPipelineName("");
    onClose();
  }

  return (
    <CellModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Pipeline"
      size="md"
    >
      <div className="space-y-6">
        <CellInput
          label="Pipeline Name"
          placeholder="e.g., Customer Data Processing"
          value={newPipelineName}
          onChange={(e) => setNewPipelineName(e.target.value)}
          autoFocus
        />

        <div className="flex justify-end space-x-3">
          <CellButton
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </CellButton>
          <CellButton
            variant="primary"
            onClick={handleCreate}
            disabled={!newPipelineName.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Pipeline"
            )}
          </CellButton>
        </div>
      </div>
    </CellModal>
  );
};

export default CreatePipelineModal;
