"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Database,
  HardDrive,
  Zap,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  Settings
} from "lucide-react";
import { cn } from "../../lib/utils/cn";
import StatusBadge from "../ui/StatusBadge";

interface JobStatus {
  isProcessing: boolean;
  currentJob?: {
    id: string;
    name: string;
    type: string;
    startTime: Date;
    progress?: number;
  };
  lastJob?: {
    id: string;
    name: string;
    status: "completed" | "failed";
    endTime: Date;
    duration?: number;
  };
  stats: {
    totalJobs: number;
    completedToday: number;
    failedToday: number;
    successRate: number;
  };
  systemStats: {
    dataSources: number;
    activePipelines: number;
    storageUsed?: string;
    uptime?: string;
  };
}

const StatusFooter: React.FC = () => {
  const router = useRouter();
  const [status, setStatus] = useState<JobStatus>({
    isProcessing: false,
    stats: {
      totalJobs: 0,
      completedToday: 0,
      failedToday: 0,
      successRate: 100,
    },
    systemStats: {
      dataSources: 0,
      activePipelines: 0,
    },
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Poll for job status updates
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Try to fetch current job status
        const [jobsResponse, statsResponse] = await Promise.all([
          fetch('/api/jobs?status=running').catch(() => null),
          fetch('/api/jobs/stats').catch(() => null),
        ]);

        if (jobsResponse?.ok) {
          const jobsData = await jobsResponse.json();
          const runningJobs = jobsData.jobs || [];
          
          if (runningJobs.length > 0) {
            const currentJob = runningJobs[0];
            setStatus(prev => ({
              ...prev,
              isProcessing: true,
              currentJob: {
                id: currentJob.id,
                name: currentJob.name,
                type: currentJob.type,
                startTime: new Date(currentJob.startTime || Date.now()),
                progress: currentJob.progress,
              },
            }));
          } else {
            setStatus(prev => ({
              ...prev,
              isProcessing: false,
              currentJob: undefined,
            }));
          }
        }

        if (statsResponse?.ok) {
          const statsData = await statsResponse.json();
          setStatus(prev => ({
            ...prev,
            stats: statsData.stats || prev.stats,
            systemStats: statsData.systemStats || prev.systemStats,
            lastJob: statsData.lastJob || prev.lastJob,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 5 seconds
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update elapsed time for running jobs
  useEffect(() => {
    if (!status.currentJob) {
      setElapsedTime(0);
      return;
    }

    const updateElapsed = () => {
      const elapsed = Math.floor((Date.now() - status.currentJob!.startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [status.currentJob]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return '—';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-black border-t-2 border-black shadow-cell-lg">
      {/* Main Footer Bar */}
      <div className="px-6 py-2 flex items-center justify-between">
        {/* Left: Current Activity */}
        <div className="flex items-center gap-6">
          {status.isProcessing && status.currentJob ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-tangerine-400 rounded-full animate-pulse" />
                <Activity className="w-4 h-4 text-tangerine-400 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Processing: {status.currentJob.name}
                </div>
                <div className="text-xs text-white/60">
                  {formatTime(elapsedTime)} elapsed
                  {status.currentJob.progress !== undefined && (
                    <span className="ml-2">• {Math.round(status.currentJob.progress)}%</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white/60">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">System Idle</span>
            </div>
          )}

          {/* Last Job */}
          {status.lastJob && !status.isProcessing && (
            <div className="hidden md:flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3 text-white/50" />
              <span className="text-white/60">Last:</span>
              <span className="text-white font-medium">{status.lastJob.name}</span>
              <StatusBadge status={status.lastJob.status} size="sm" />
              {status.lastJob.duration && (
                <span className="text-white/60">
                  ({formatDuration(status.lastJob.duration)})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center: Quick Stats */}
        <div className="hidden lg:flex items-center gap-6">
          <StatItem
            icon={CheckCircle}
            label="Completed"
            value={status.stats.completedToday}
            color="text-green-400"
          />
          {status.stats.failedToday > 0 && (
            <StatItem
              icon={XCircle}
              label="Failed"
              value={status.stats.failedToday}
              color="text-red-400"
            />
          )}
          <StatItem
            icon={TrendingUp}
            label="Success Rate"
            value={`${status.stats.successRate}%`}
            color="text-apricot-400"
          />
          <StatItem
            icon={Database}
            label="Data Sources"
            value={status.systemStats.dataSources}
            color="text-dark_cyan-400"
          />
        </div>

        {/* Right: Settings & Expand Button */}
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            onClick={() => router.push('/settings')}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all group"
            title="Settings"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden sm:inline">Hide Details</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">More Info</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-white/10 bg-white/5 px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <DetailStat
              icon={CheckCircle}
              label="Total Jobs"
              value={status.stats.totalJobs}
            />
            <DetailStat
              icon={CheckCircle}
              label="Completed Today"
              value={status.stats.completedToday}
              valueColor="text-green-400"
            />
            <DetailStat
              icon={XCircle}
              label="Failed Today"
              value={status.stats.failedToday}
              valueColor="text-red-400"
            />
            <DetailStat
              icon={Database}
              label="Data Sources"
              value={status.systemStats.dataSources}
            />
            <DetailStat
              icon={Zap}
              label="Active Pipelines"
              value={status.systemStats.activePipelines}
            />
            {status.systemStats.storageUsed && (
              <DetailStat
                icon={HardDrive}
                label="Storage Used"
                value={status.systemStats.storageUsed}
              />
            )}
          </div>

          {/* Current Job Progress */}
          {status.isProcessing && status.currentJob && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-tangerine-400" />
                  <span className="text-sm font-bold text-white">
                    {status.currentJob.name}
                  </span>
                  <span className="text-xs text-white/60">
                    ({status.currentJob.type})
                  </span>
                </div>
                <span className="text-sm text-white">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              
              {status.currentJob.progress !== undefined && (
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-tangerine-400 rounded-full transition-all duration-300"
                    style={{ width: `${status.currentJob.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </footer>
  );
};

// Helper Component: Quick Stat Item
interface StatItemProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  color?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon: Icon, label, value, color = "text-white" }) => (
  <div className="flex items-center gap-2">
    <Icon className={cn("w-4 h-4", color)} />
    <div className="flex items-baseline gap-1.5">
      <span className={cn("text-sm font-bold", color)}>{value}</span>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  </div>
);

// Helper Component: Detail Stat
interface DetailStatProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  valueColor?: string;
}

const DetailStat: React.FC<DetailStatProps> = ({ 
  icon: Icon, 
  label, 
  value, 
  valueColor = "text-white"
}) => (
  <div>
    <div className="flex items-center gap-2 mb-1">
      <Icon className="w-4 h-4 text-white/50" />
      <span className="text-xs text-white/60">{label}</span>
    </div>
    <div className={cn("text-lg font-bold", valueColor)}>{value}</div>
  </div>
);

export default StatusFooter;
