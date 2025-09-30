"use client"

import React from "react";
import { cn } from "../../lib/utils/cn";

export interface NavSection {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
}

interface SidebarNavProps {
  sections: NavSection[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  title?: string;
  className?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({
  sections,
  activeSection,
  onSectionChange,
  title,
  className,
}) => {
  return (
    <div className={cn("w-64 bg-white/5 border-r-2 border-black flex flex-col", className)}>
      <div className="p-6">
        {title && (
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">
            {title}
          </h3>
        )}
        <nav className="space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                  "border-2",
                  isActive
                    ? "bg-tangerine-400 text-black border-black shadow-cell-sm"
                    : "bg-transparent text-white border-transparent hover:bg-white/10 hover:border-black/30"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-black" : "text-white/70"
                )} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-bold",
                    isActive ? "text-black" : "text-white"
                  )}>
                    {section.title}
                  </div>
                  {section.description && (
                    <div className={cn(
                      "text-xs mt-0.5 truncate",
                      isActive ? "text-black/70" : "text-white/50"
                    )}>
                      {section.description}
                    </div>
                  )}
                </div>
                {section.badge && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-bold",
                    isActive
                      ? "bg-black/20 text-black"
                      : "bg-white/20 text-white"
                  )}>
                    {section.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default SidebarNav;
