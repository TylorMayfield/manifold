"use client"

import React from 'react';
import { cn } from '../../lib/utils/cn';

export interface ContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  centered?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Container Component
 * 
 * Standardized container widths and padding for consistent layouts.
 * 
 * Sizes:
 * - sm: max-w-2xl (reading content, forms)
 * - md: max-w-4xl (standard pages)
 * - lg: max-w-6xl (wide content)
 * - xl: max-w-7xl (dashboards)
 * - full: no max-width
 * 
 * Usage:
 *   <Container size="md" padding="lg">
 *     {children}
 *   </Container>
 */
const Container: React.FC<ContainerProps> = ({
  size = 'xl',
  padding = 'md',
  centered = true,
  className,
  children
}) => {
  const sizeClasses = {
    sm: 'max-w-2xl',   // 672px - Reading content, forms
    md: 'max-w-4xl',   // 896px - Standard pages
    lg: 'max-w-6xl',   // 1152px - Wide content
    xl: 'max-w-7xl',   // 1280px - Dashboards, tables
    full: 'max-w-none' // No limit - Full width
  };

  const paddingClasses = {
    none: '',
    sm: 'px-4 py-4',
    md: 'px-6 py-6',
    lg: 'px-8 py-8'
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        paddingClasses[padding],
        centered && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Container;

/**
 * PageContainer Component
 * 
 * Standard container for page content (includes vertical padding for footer)
 */
export interface PageContainerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  size = 'xl',
  className,
  children
}) => {
  return (
    <Container
      size={size}
      padding="lg"
      centered={true}
      className={cn('min-h-screen pb-24', className)}
    >
      {children}
    </Container>
  );
};
