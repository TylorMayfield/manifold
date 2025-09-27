"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Play, Save, X } from "lucide-react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Textarea from "../../../components/ui/Textarea";
import { clientLogger } from "../../../lib/utils/ClientLogger";

// Mock types for client-side
interface CronJob {
  id: string;
  name: string;
  description: string;
  schedule: string;
  enabled: boolean;
  type: string;
  config: any;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule: "0 0 * * *", // Daily at midnight
    type: "data_sync",
    enabled: true,
    config: {
      timeout: 300,
      retries: 3,
      notifications: {
        onSuccess: true,
        onFailure: true,
        onStart: false,
      },
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      clientLogger.error("Job name is required", "job-management");
      return;
    }

    try {
      setLoading(true);

      // Mock job creation - in real implementation, this would call the scheduler
      const newJob: CronJob = {
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: formData.name,
        description: formData.description,
        schedule: formData.schedule,
        enabled: formData.enabled,
        type: formData.type,
        config: formData.config,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      clientLogger.success("Job created successfully", "job-management", {
        jobId: newJob.id,
        jobName: newJob.name,
      });

      // Redirect back to jobs page
      router.push("/jobs");
    } catch (error) {
      clientLogger.error("Failed to create job", "job-management", { error });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/jobs");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-dark_cyan-200 border-opacity-10">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to Jobs
          </Button>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-tangerine-500/20">
              <Clock className="h-5 w-5 text-tangerine-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Create New Job</h1>
              <p className="text-dark_cyan-400">
                Set up a new scheduled job for your project
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-yellow-400">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Creating...</span>
            </div>
          )}

          <Button
            onClick={handleCancel}
            variant="outline"
            icon={<X className="h-4 w-4" />}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            icon={<Save className="h-4 w-4" />}
          >
            Create Job
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-tangerine-400" />
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Job Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter a descriptive name for your job"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe what this job does..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Job Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                  >
                    <option value="data_sync">Data Sync</option>
                    <option value="backup">Backup</option>
                    <option value="cleanup">Cleanup</option>
                    <option value="custom_script">Custom Script</option>
                    <option value="api_poll">API Poll</option>
                    <option value="workflow">Workflow</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) =>
                      setFormData({ ...formData, enabled: e.target.checked })
                    }
                    className="rounded border-white/20 bg-white/10 text-tangerine-500 focus:ring-tangerine-500"
                  />
                  <label htmlFor="enabled" className="text-sm text-white">
                    Enable job immediately after creation
                  </label>
                </div>
              </div>
            </div>

            {/* Schedule Configuration */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Play className="h-5 w-5 text-blue-400" />
                Schedule Configuration
              </h2>

              <div className="space-y-4">
                <div>
                  <Input
                    label="Cron Expression"
                    value={formData.schedule}
                    onChange={(e) =>
                      setFormData({ ...formData, schedule: e.target.value })
                    }
                    placeholder="0 0 * * *"
                    required
                  />
                  <p className="text-xs text-dark_cyan-400 mt-1">
                    Use standard cron syntax. Example: "0 0 * * *" for daily at
                    midnight
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-400/20">
                  <h4 className="text-sm font-medium text-blue-400 mb-2">
                    Common Cron Patterns
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-dark_cyan-400">
                    <div>
                      • <strong>0 0 * * *</strong> - Daily at midnight
                    </div>
                    <div>
                      • <strong>0 */6 * * *</strong> - Every 6 hours
                    </div>
                    <div>
                      • <strong>0 9 * * 1</strong> - Every Monday at 9 AM
                    </div>
                    <div>
                      • <strong>*/15 * * * *</strong> - Every 15 minutes
                    </div>
                    <div>
                      • <strong>0 0 1 * *</strong> - First day of every month
                    </div>
                    <div>
                      • <strong>0 0 * * 0</strong> - Every Sunday at midnight
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Configuration */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-400" />
                Advanced Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.config.timeout}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          timeout: parseInt(e.target.value) || 300,
                        },
                      })
                    }
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                    min="1"
                    max="3600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    value={formData.config.retries}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          retries: parseInt(e.target.value) || 3,
                        },
                      })
                    }
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-tangerine-500"
                    min="0"
                    max="10"
                  />
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-white mb-3">
                  Notifications
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="notify-success"
                      checked={formData.config.notifications.onSuccess}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            notifications: {
                              ...formData.config.notifications,
                              onSuccess: e.target.checked,
                            },
                          },
                        })
                      }
                      className="rounded border-white/20 bg-white/10 text-tangerine-500 focus:ring-tangerine-500"
                    />
                    <label
                      htmlFor="notify-success"
                      className="text-sm text-white"
                    >
                      Notify on successful execution
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="notify-failure"
                      checked={formData.config.notifications.onFailure}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            notifications: {
                              ...formData.config.notifications,
                              onFailure: e.target.checked,
                            },
                          },
                        })
                      }
                      className="rounded border-white/20 bg-white/10 text-tangerine-500 focus:ring-tangerine-500"
                    />
                    <label
                      htmlFor="notify-failure"
                      className="text-sm text-white"
                    >
                      Notify on execution failure
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="notify-start"
                      checked={formData.config.notifications.onStart}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            notifications: {
                              ...formData.config.notifications,
                              onStart: e.target.checked,
                            },
                          },
                        })
                      }
                      className="rounded border-white/20 bg-white/10 text-tangerine-500 focus:ring-tangerine-500"
                    />
                    <label
                      htmlFor="notify-start"
                      className="text-sm text-white"
                    >
                      Notify when job starts
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
