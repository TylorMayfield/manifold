"use client"

import React from "react";
import { Inbox } from "lucide-react";
import CellButton from "./CellButton";
import { cn } from "../../lib/utils/cn";

interface EmptyStateProps {
  icon?: React.ComponentType<any>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<any>;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<any>;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  secondaryAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="mb-6 p-6 bg-gray-100 rounded-2xl border border-gray-300">
        <Icon className="w-16 h-16 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-gray-600 mb-8 max-w-md">
          {description}
        </p>
      )}
      
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <CellButton
              variant="primary"
              onClick={action.onClick}
            >
              {action.icon && <action.icon className="w-4 h-4 mr-2" />}
              {action.label}
            </CellButton>
          )}
          
          {secondaryAction && (
            <CellButton
              variant="secondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4 mr-2" />}
              {secondaryAction.label}
            </CellButton>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
