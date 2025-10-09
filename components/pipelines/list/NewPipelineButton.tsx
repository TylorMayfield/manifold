"use client";

import React from "react";
import { Plus } from "lucide-react";
import CellButton from "../../ui/CellButton";

interface NewPipelineButtonProps {
  onClick: () => void;
}

const NewPipelineButton: React.FC<NewPipelineButtonProps> = ({ onClick }) => {
  return (
    <CellButton
      variant="primary"
      size="sm"
      onClick={onClick}
    >
      <Plus className="w-4 h-4 mr-2" />
      New Pipeline
    </CellButton>
  );
};

export default NewPipelineButton;
