"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDataSources } from "../../contexts/DataSourceContext";
import PageLayout from "../../components/layout/PageLayout";
import CellModal from "../../components/ui/CellModal";
import DefaultJobsManager from "../../components/jobs/DefaultJobsManager";
import {
  PageHeader,
  StatsCard,
  FilterBar,
  EmptyState,
  ListCard,
  StatusBadge,
  ActionButtonGroup,
  SearchBar,
  CellButton
} from "../../components/ui";
import {
  Play,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
  Eye,
  Trash2,
  Pause
} from "lucide-react";

interface Job {
  id: string;
  name: string;
  description: string;
  type: "pipeline" | "script" | "sync" | "backup";
  status: "active" | "paused" | "failed" | "completed";
  schedule?: string;
  lastRun?: Date;
  nextRun?: Date;
  duration?: number;
  createdAt: Date;
  pipelineId?: string;
  dataSourceId?: string;
}

interface JobExecution {
  id: string;
  jobId: string;
  status: "running" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
  duration?: number;
  logs?: string[];
  error?: string;
}

export default function JobsPage() {
  const router = useRouter();
  const { dataSources } = useDataSources();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<JobExecution | null>(null);

  // Filter and search jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = filterStatus === "all" || job.status === filterStatus;
    const matchesSearch = job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleRunJob = (jobId: string) => {
    console.log("Running job:", jobId);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  const parseCronExpression = (cron: string) => {
    if (cron === "0 2 * * *") return "Daily at 2:00 AM";
    if (cron === "0 9 * * 1") return "Weekly on Monday at 9:00 AM";
    if (cron === "0 */6 * * *") return "Every 6 hours";
    return cron;
  };

  const getTypeIcon = (type: Job["type"]) => {
    switch (type) {
      case "pipeline": return "⚡";
      case "script": return "📜";
      case "sync": return "🔄";
      case "backup": return "💾";
      default: return "⚙️";
    }
  };

  // Stats data
  const stats = [
    {
      title: "Total Jobs",
      value: jobs.length,
      icon: Play,
      variant: 'default' as const
    },
    {
      title: "Active",
      value: jobs.filter(j => j.status === "active").length,
      icon: CheckCircle,
      variant: 'success' as const
    },
    {
      title: "Failed",
      value: jobs.filter(j => j.status === "failed").length,
      icon: XCircle,
      variant: 'error' as const
    },
    {
      title: "Last 24h Runs",
      value: executions.length,
      icon: RefreshCw,
      variant: 'info' as const
    }
  ];

  // Filter options
  const filterOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "paused", label: "Paused" },
    { value: "failed", label: "Failed" },
    { value: "completed", label: "Completed" }
  ];

  return (
    <PageLayout
      title="Scheduled Jobs"
      subtitle="Automate your data processing"
      icon={Play}
      showNavigation={true}
      showBackButton={true}
      backButtonHref="/"
      headerActions={
        <div className="flex items-center gap-2">
          <CellButton variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Schedule Job
          </CellButton>
          <CellButton variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </CellButton>
        </div>
      }
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* System Jobs */}
      <div className="mb-6">
        <DefaultJobsManager />
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search jobs by name or description..."
          />
        </div>
        <div className="md:w-auto">
          <FilterBar
            options={filterOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            label="Status"
          />
        </div>
      </div>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={filterStatus === "all" ? "No jobs scheduled" : `No ${filterStatus} jobs`}
          description="Schedule jobs to automate your data processing workflows. Jobs can run pipelines, sync data sources, or execute custom scripts on a schedule."
          action={{
            label: "Schedule Your First Job",
            onClick: () => setShowCreateModal(true),
            icon: Plus
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <ListCard
              key={job.id}
              title={job.name}
              subtitle={job.description}
              icon={<span className="text-2xl">{getTypeIcon(job.type)}</span>}
              badge={<StatusBadge status={job.status as any} />}
              actions={
                <ActionButtonGroup
                  actions={[
                    { type: "play", label: "Run", onClick: () => handleRunJob(job.id) },
                    { type: "view", label: "View", onClick: () => {
                      const execution = executions.find(e => e.jobId === job.id);
                      if (execution) {
                        setSelectedExecution(execution);
                        setShowExecutionModal(true);
                      }
                    }},
                    { type: "settings", label: "Settings", onClick: () => {} },
                    { type: "delete", label: "Delete", onClick: () => {} }
                  ]}
                />
              }
              metadata={[
                {
                  label: "Schedule",
                  value: job.schedule ? parseCronExpression(job.schedule) : "Manual only"
                },
                {
                  label: "Last Run",
                  value: job.lastRun ? job.lastRun.toLocaleString() : "Never"
                },
                {
                  label: "Next Run",
                  value: job.nextRun ? job.nextRun.toLocaleString() : "N/A"
                },
                {
                  label: "Duration",
                  value: job.duration ? formatDuration(job.duration) : "N/A"
                }
              ]}
            />
          ))}
        </div>
      )}

      {/* Create Job Modal - Simplified, actual implementation would be in a separate component */}
      <CellModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule New Job"
        size="lg"
      >
        <div className="text-white">
          <p className="mb-4">Job creation form would go here...</p>
          <CellButton onClick={() => router.push('/jobs/new')}>
            Go to Full Job Creator
          </CellButton>
        </div>
      </CellModal>

      {/* Execution Details Modal */}
      <CellModal
        isOpen={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        title="Execution Details"
        size="lg"
      >
        {selectedExecution && (
          <div className="text-white space-y-4">
            <div>
              <StatusBadge status={selectedExecution.status as any} />
            </div>
            <div>
              <p className="text-sm text-white/70">Start Time</p>
              <p>{selectedExecution.startTime.toLocaleString()}</p>
            </div>
            {selectedExecution.endTime && (
              <div>
                <p className="text-sm text-white/70">End Time</p>
                <p>{selectedExecution.endTime.toLocaleString()}</p>
              </div>
            )}
            {selectedExecution.duration && (
              <div>
                <p className="text-sm text-white/70">Duration</p>
                <p>{formatDuration(selectedExecution.duration)}</p>
              </div>
            )}
            {selectedExecution.error && (
              <div className="p-4 bg-error/20 border-2 border-error rounded">
                <p className="font-bold mb-2">Error</p>
                <p className="text-sm">{selectedExecution.error}</p>
              </div>
            )}
          </div>
        )}
      </CellModal>
    </PageLayout>
  );
}
