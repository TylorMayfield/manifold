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
    <div className={cn("min-h-screen bg-gray-100", className)}>
      {/* Header - stays dark and sticky */}
      <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700 shadow-sm">
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
              {Icon && <Icon className="w-6 h-6 text-blue-500" />}
              <div>
                <h1 className="text-heading font-bold font-mono text-white">{title}</h1>
                {subtitle && (
                  <span className="text-caption text-gray-300">{subtitle}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {headerActions}
          </div>
        </div>
      </header>

      {/* Breadcrumbs - sticky below header */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="sticky top-[73px] z-40 border-b border-gray-300 px-4 py-2 bg-white">
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

      {/* Navigation - sticky below header/breadcrumbs */}
      {showNavigation && (
        <div className={cn(
          "sticky z-30 bg-gray-100",
          breadcrumbs && breadcrumbs.length > 0 ? "top-[115px]" : "top-[73px]"
        )}>
          <AppNav 
            className="mb-0 shadow-sm" 
            variant={navigationProps.variant}
            showDescriptions={navigationProps.showDescriptions}
          />
        </div>
      )}

      {/* Main Content - scrollable */}
      <main className={cn("p-6", contentClassName)}>
        {children}
      </main>
    </div>
  );
}