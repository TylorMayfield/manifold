"use client"

import React from "react";
import { Play, Pause, Trash2, Edit, Eye, Settings, RefreshCw, Download } from "lucide-react";
import CellButton from "./CellButton";
import { cn } from "../../lib/utils/cn";

export interface ActionButton {
  type: "play" | "pause" | "delete" | "edit" | "view" | "settings" | "refresh" | "download" | "custom";
  label?: string;
  onClick: () => void;
  icon?: React.ComponentType<any>;
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}

interface ActionButtonGroupProps {
  actions: ActionButton[];
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const defaultActionConfig = {
  play: { icon: Play, variant: "primary" as const, label: "Run" },
  pause: { icon: Pause, variant: "secondary" as const, label: "Pause" },
  delete: { icon: Trash2, variant: "danger" as const, label: "Delete" },
  edit: { icon: Edit, variant: "secondary" as const, label: "Edit" },
  view: { icon: Eye, variant: "secondary" as const, label: "View" },
  settings: { icon: Settings, variant: "secondary" as const, label: "Settings" },
  refresh: { icon: RefreshCw, variant: "secondary" as const, label: "Refresh" },
  download: { icon: Download, variant: "secondary" as const, label: "Download" },
};

const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  actions,
  size = "sm",
  orientation = "horizontal",
  className,
}) => {
  return (
    <div
      className={cn(
        "flex gap-2",
        orientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
    >
      {actions.map((action, index) => {
        const config = action.type !== "custom" ? defaultActionConfig[action.type] : null;
        const Icon = action.icon || config?.icon;
        const variant = action.variant || config?.variant || "secondary";
        const label = action.label || config?.label || "";

        return (
          <CellButton
            key={index}
            variant={variant}
            size={size}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              Icon && <Icon className="w-4 h-4" />
            )}
            {label && size !== "sm" && <span className="ml-2">{label}</span>}
          </CellButton>
        );
      })}
    </div>
  );
};

export default ActionButtonGroup;
