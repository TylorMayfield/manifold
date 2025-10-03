"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils/cn';
import { ArrowLeft, Settings } from 'lucide-react';
import AppNav from './AppNav';
import CellButton from '../ui/CellButton';

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  breadcrumbs?: Breadcrumb[];
  headerActions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showNavigation?: boolean;
  navigationProps?: {
    variant?: 'horizontal' | 'vertical';
    showDescriptions?: boolean;
  };
}

export default function PageLayout({
  children,
  title,
  subtitle,
  icon: Icon,
  showBackButton = false,
  backButtonText = "Back",
  backButtonHref = "/",
  breadcrumbs,
  headerActions,
  className,
  contentClassName,
  showNavigation = true,
  navigationProps = {}
}: PageLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("min-h-screen bg-black", className)}>
      {/* Header */}
      <header className="bg-gray-900 border-b-2 border-gray-700 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <CellButton
                variant="secondary"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" />
              </CellButton>
            )}
            
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="w-6 h-6 text-blue-400" />}
              <div>
                <h1 className="text-heading font-bold font-mono text-white">{title}</h1>
                {subtitle && (
                  <span className="text-caption text-gray-400">{subtitle}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="border-b-2 border-gray-800 px-4 py-2 bg-gray-900/50">
          <nav className="flex" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-600">/</span>
                )}
                {crumb.href ? (
                  <button
                    onClick={() => router.push(crumb.href!)}
                    className="text-sm font-mono hover:underline text-gray-400 hover:text-white transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-sm font-mono text-white">
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Navigation */}
      {showNavigation && (
        <AppNav 
          className="mb-8" 
          variant={navigationProps.variant}
          showDescriptions={navigationProps.showDescriptions}
        />
      )}

      {/* Main Content */}
      <main className={cn("p-6", contentClassName)}>
        {children}
      </main>
    </div>
  );
}