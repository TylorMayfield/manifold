"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '../../lib/utils/cn';
import { 
  Database, 
  FileText, 
  Zap, 
  Settings, 
  Play, 
  Home,
  Webhook,
  Layers,
  Puzzle
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface AppNavProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showIcons?: boolean;
  showDescriptions?: boolean;
}

const defaultNavItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    description: 'Dashboard and overview'
  },
  {
    href: '/data',
    label: 'Data Sources',
    icon: Database,
    description: 'Manage data connections'
  },
  {
    href: '/data-lakes',
    label: 'Data Lakes',
    icon: Layers,
    description: 'Unified data lake management'
  },
  {
    href: '/plugins',
    label: 'Plugins',
    icon: Puzzle,
    description: 'Manage and configure plugins'
  },
  {
    href: '/pipelines',
    label: 'Pipelines',
    icon: Zap,
    description: 'Transform and process data'
  },
  {
    href: '/jobs',
    label: 'Jobs',
    icon: Play,
    description: 'Scheduled automation'
  },
  {
    href: '/webhooks',
    label: 'Webhooks',
    icon: Webhook,
    description: 'Notifications and integrations'
  },
  {
    href: '/observability',
    label: 'Observability',
    icon: FileText,
    description: 'Logs, metrics, and monitoring'
  }
];

export default function AppNav({ 
  className,
  variant = 'horizontal',
  showIcons = true,
  showDescriptions = false 
}: AppNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    // Exact match or starts with href followed by a slash
    // This prevents /data from matching /data-lakes
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (variant === 'vertical') {
    return (
      <nav className={cn("cell-nav", className)}>
        <div className="flex flex-col">
          {defaultNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "cell-nav-item flex items-center text-left p-4 border-b-2 border-black last:border-b-0",
                  active && "active bg-gray-100"
                )}
              >
                {showIcons && (
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  {showDescriptions && item.description && (
                    <div className="text-caption text-gray-500 mt-1">
                      {item.description}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  const navItems = defaultNavItems.filter(item => item.href !== '/plugins');

  return (
    <nav className={cn("cell-nav", className)}>
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={cn(
                "cell-nav-item flex items-center px-4 py-2 border-r-2 border-black last:border-r-0",
                active && "active bg-gray-100"
              )}
            >
              {showIcons && (
                <Icon className="w-4 h-4 mr-2" />
              )}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}