"use client";

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
  Settings,
  HelpCircle,
} from "lucide-react";
import { cn } from "../../lib/utils/cn";
import StatusBadge from "../ui/StatusBadge";
import FeatureDiscovery from "../ui/FeatureDiscovery";
import CellModal from "../ui/CellModal";

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
  const [showFeatureDiscovery, setShowFeatureDiscovery] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Poll for job status updates
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Try to fetch current job status
        const [jobsResponse, statsResponse] = await Promise.all([
          fetch("/api/jobs?status=running").catch(() => null),
          fetch("/api/jobs/stats").catch(() => null),
        ]);

        if (jobsResponse?.ok) {
          const jobsData = await jobsResponse.json();
          const runningJobs = jobsData.jobs || [];

          if (runningJobs.length > 0) {
            const currentJob = runningJobs[0];
            setStatus((prev) => ({
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
            setStatus((prev) => ({
              ...prev,
              isProcessing: false,
              currentJob: undefined,
            }));
          }
        }

        if (statsResponse?.ok) {
          const statsData = await statsResponse.json();
          setStatus((prev) => ({
            ...prev,
            stats: statsData.stats || prev.stats,
            systemStats: statsData.systemStats || prev.systemStats,
            lastJob: statsData.lastJob || prev.lastJob,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch job status:", error);
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
      const elapsed = Math.floor(
        (Date.now() - status.currentJob!.startTime.getTime()) / 1000
      );
      setElapsedTime(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [status.currentJob]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return "—";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-t-2 border-black shadow-[0px_-4px_12px_rgba(0,0,0,0.5)]">
      {/* Main Footer Bar */}
      <div className="px-6 py-3 flex items-center justify-between backdrop-blur-sm">
        {/* Left: Current Activity */}
        <div className="flex items-center gap-6">
          {status.isProcessing && status.currentJob ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-orange-500 rounded-md shadow-[2px_2px_0px_0px_rgba(234,88,12,0.5)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <Activity className="w-4 h-4 text-orange-300 animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold font-mono text-white">
                  Processing: {status.currentJob.name}
                </div>
                <div className="text-xs font-mono text-orange-200">
                  {formatTime(elapsedTime)} elapsed
                  {status.currentJob.progress !== undefined && (
                    <span className="ml-2">
                      • {Math.round(status.currentJob.progress)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-600/30 rounded-md">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm font-mono text-green-300">
                System Idle
              </span>
            </div>
          )}

          {/* Last Job */}
          {status.lastJob && !status.isProcessing && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-xs font-mono">
              <Clock className="w-3 h-3 text-white/50" />
              <span className="text-white/60">Last:</span>
              <span className="text-white font-medium">
                {status.lastJob.name}
              </span>
              <StatusBadge status={status.lastJob.status} />
              {status.lastJob.duration && (
                <span className="text-white/60">
                  ({formatDuration(status.lastJob.duration)})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Center: Quick Stats */}
        <div className="hidden lg:flex items-center gap-3">
          <StatItem
            icon={CheckCircle}
            label="Completed"
            value={status.stats.completedToday}
            color="text-green-400"
            bgColor="bg-green-500/10"
            borderColor="border-green-600/30"
          />
          {status.stats.failedToday > 0 && (
            <StatItem
              icon={XCircle}
              label="Failed"
              value={status.stats.failedToday}
              color="text-red-400"
              bgColor="bg-red-500/10"
              borderColor="border-red-600/30"
            />
          )}
          <StatItem
            icon={TrendingUp}
            label="Success Rate"
            value={`${status.stats.successRate}%`}
            color="text-blue-400"
            bgColor="bg-blue-500/10"
            borderColor="border-blue-600/30"
          />
          <StatItem
            icon={Database}
            label="Data Sources"
            value={status.systemStats.dataSources}
            color="text-purple-400"
            bgColor="bg-purple-500/10"
            borderColor="border-purple-600/30"
          />
        </div>

        {/* Right: Help, Settings & Expand Button */}
        <div className="flex items-center gap-2">
          {/* Help Button */}
          <button
            onClick={() => setShowFeatureDiscovery(true)}
            className="p-2 rounded-md border-2 border-transparent hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 group shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
            title="Feature Discovery"
          >
            <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => router.push("/settings")}
            className="p-2 rounded-md border-2 border-transparent hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 group shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
            title="Settings"
          >
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Expand Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border-2 border-white/20 bg-white/5 hover:bg-white/10 text-sm font-mono text-white/70 hover:text-white transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.1)]"
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden sm:inline">Hide</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4" />
                <span className="hidden sm:inline">More</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t-2 border-white/20 bg-gradient-to-b from-white/5 to-transparent px-6 py-4 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <DetailStat
              icon={CheckCircle}
              label="Total Jobs"
              value={status.stats.totalJobs}
              bgColor="bg-blue-500/10"
              borderColor="border-blue-600/30"
            />
            <DetailStat
              icon={CheckCircle}
              label="Completed Today"
              value={status.stats.completedToday}
              valueColor="text-green-400"
              bgColor="bg-green-500/10"
              borderColor="border-green-600/30"
            />
            <DetailStat
              icon={XCircle}
              label="Failed Today"
              value={status.stats.failedToday}
              valueColor="text-red-400"
              bgColor="bg-red-500/10"
              borderColor="border-red-600/30"
            />
            <DetailStat
              icon={Database}
              label="Data Sources"
              value={status.systemStats.dataSources}
              valueColor="text-purple-400"
              bgColor="bg-purple-500/10"
              borderColor="border-purple-600/30"
            />
            <DetailStat
              icon={Zap}
              label="Active Pipelines"
              value={status.systemStats.activePipelines}
              valueColor="text-yellow-400"
              bgColor="bg-yellow-500/10"
              borderColor="border-yellow-600/30"
            />
            {status.systemStats.storageUsed && (
              <DetailStat
                icon={HardDrive}
                label="Storage Used"
                value={status.systemStats.storageUsed}
                valueColor="text-cyan-400"
                bgColor="bg-cyan-500/10"
                borderColor="border-cyan-600/30"
              />
            )}
          </div>

          {/* Current Job Progress */}
          {status.isProcessing && status.currentJob && (
            <div className="mt-4 pt-4 border-t border-white/10 px-4 py-3 bg-orange-500/10 border-2 border-orange-600/30 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400 animate-pulse" />
                  <span className="text-sm font-bold font-mono text-white">
                    {status.currentJob.name}
                  </span>
                  <span className="text-xs font-mono text-orange-300 px-2 py-0.5 bg-orange-500/20 border border-orange-600/30 rounded">
                    {status.currentJob.type}
                  </span>
                </div>
                <span className="text-sm font-mono font-bold text-orange-300">
                  {formatTime(elapsedTime)}
                </span>
              </div>

              {status.currentJob.progress !== undefined && (
                <div className="relative h-3 bg-black/30 border-2 border-orange-600/30 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500 rounded-full transition-all duration-300 shadow-[2px_2px_0px_0px_rgba(234,88,12,0.3)]"
                    style={{ width: `${status.currentJob.progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold font-mono text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      {Math.round(status.currentJob.progress)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Feature Discovery Modal */}
      <CellModal
        isOpen={showFeatureDiscovery}
        onClose={() => setShowFeatureDiscovery(false)}
        title="Discover Features"
        size="xl"
      >
        <FeatureDiscovery onClose={() => setShowFeatureDiscovery(false)} />
      </CellModal>
    </footer>
  );
};

// Helper Component: Quick Stat Item
interface StatItemProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  color?: string;
  bgColor?: string;
  borderColor?: string;
}

const StatItem: React.FC<StatItemProps> = ({
  icon: Icon,
  label,
  value,
  color = "text-white",
  bgColor = "bg-white/5",
  borderColor = "border-white/10",
}) => (
  <div
    className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all duration-200 hover:scale-105",
      bgColor,
      borderColor
    )}
  >
    <Icon className={cn("w-4 h-4", color)} />
    <div className="flex items-baseline gap-1.5">
      <span className={cn("text-sm font-bold font-mono", color)}>{value}</span>
      <span className="text-xs font-mono text-white/50">{label}</span>
    </div>
  </div>
);

// Helper Component: Detail Stat
interface DetailStatProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  valueColor?: string;
  bgColor?: string;
  borderColor?: string;
}

const DetailStat: React.FC<DetailStatProps> = ({
  icon: Icon,
  label,
  value,
  valueColor = "text-white",
  bgColor = "bg-white/5",
  borderColor = "border-white/10",
}) => (
  <div
    className={cn(
      "p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]",
      bgColor,
      borderColor
    )}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-white/50" />
      <span className="text-xs font-mono text-white/60 uppercase tracking-wide">
        {label}
      </span>
    </div>
    <div className={cn("text-2xl font-bold font-mono", valueColor)}>
      {value}
    </div>
  </div>
);

export default StatusFooter;
