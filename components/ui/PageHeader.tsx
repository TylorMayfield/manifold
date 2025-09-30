"use client"

import React from 'react';
import { LucideIcon } from 'lucide-react';
import CellButton from './CellButton';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

/**
 * PageHeader Component
 * 
 * Consistent header for pages with title, subtitle, icon, and actions.
 * 
 * Usage:
 *   <PageHeader 
 *     title="Jobs" 
 *     subtitle="Manage scheduled tasks"
 *     icon={Play}
 *     actions={<CellButton>New Job</CellButton>}
 *   />
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  breadcrumbs
}) => {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-white/70 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-white transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-white">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="p-3 bg-white/10 border-2 border-black rounded-lg">
              <Icon className="w-8 h-8 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
            {subtitle && (
              <p className="text-lg text-white/70">{subtitle}</p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
