"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Play, Save } from "lucide-react";
import PageLayout from "../../../components/layout/PageLayout";
import CellButton from "../../../components/ui/CellButton";
import CellInput from "../../../components/ui/CellInput";
import CellCard from "../../../components/ui/CellCard";
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
    <PageLayout
      title="Create New Job"
      subtitle="Set up a new scheduled job for your project"
      icon={Clock}
      showBackButton={true}
      backButtonHref="/jobs"
      headerActions={
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-yellow-400">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Creating...</span>
            </div>
          )}
          <CellButton
            variant="ghost"
            onClick={handleCancel}
          >
            Cancel
          </CellButton>
          <CellButton
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            variant="primary"
          >
            <Save className="w-4 h-4 mr-2" />
            Create Job
          </CellButton>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <CellCard className="p-6">
            <h2 className="text-subheading font-bold mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <CellInput
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
                <label className="block text-sm font-medium text-white mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what this job does..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border-2 border-black rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-apricot-400"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Job Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-dark_cyan-500 focus:border-dark_cyan-500"
                >
                  <option value="pipeline">Pipeline</option>
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
                  className="rounded border-gray-300 text-dark_cyan-600 focus:ring-dark_cyan-500"
                />
                <label htmlFor="enabled" className="text-sm font-bold text-gray-900">
                  Enable job immediately after creation
                </label>
              </div>
            </div>
          </CellCard>

          {/* Schedule Configuration */}
          <CellCard className="p-6">
            <h2 className="text-subheading font-bold mb-6 flex items-center gap-2">
              <Play className="h-5 w-5 text-gray-600" />
              Schedule Configuration
            </h2>

            <div className="space-y-4">
              <div>
                <CellInput
                  label="Cron Expression"
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, schedule: e.target.value })
                  }
                  placeholder="0 0 * * *"
                  required
                />
                <p className="text-caption text-gray-600 mt-1">
                  Use standard cron syntax. Example: "0 0 * * *" for daily at midnight
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <h4 className="text-sm font-bold text-blue-800 mb-2">
                  Common Cron Patterns
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-caption text-blue-700">
                  <div>• <strong>0 0 * * *</strong> - Daily at midnight</div>
                  <div>• <strong>0 */6 * * *</strong> - Every 6 hours</div>
                  <div>• <strong>0 9 * * 1</strong> - Every Monday at 9 AM</div>
                  <div>• <strong>*/15 * * * *</strong> - Every 15 minutes</div>
                  <div>• <strong>0 0 1 * *</strong> - First day of every month</div>
                  <div>• <strong>0 0 * * 0</strong> - Every Sunday at midnight</div>
                </div>
              </div>
            </div>
          </CellCard>

          {/* Advanced Configuration */}
          <CellCard className="p-6">
            <h2 className="text-subheading font-bold mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Advanced Configuration
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
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
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-dark_cyan-500 focus:border-dark_cyan-500"
                  min="1"
                  max="3600"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
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
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-dark_cyan-500 focus:border-dark_cyan-500"
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-bold text-gray-900 mb-3">
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
                    className="rounded border-gray-300 text-dark_cyan-600 focus:ring-dark_cyan-500"
                  />
                  <label
                    htmlFor="notify-success"
                    className="text-sm font-bold text-gray-900"
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
                    className="rounded border-gray-300 text-dark_cyan-600 focus:ring-dark_cyan-500"
                  />
                  <label
                    htmlFor="notify-failure"
                    className="text-sm font-bold text-gray-900"
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
                    className="rounded border-gray-300 text-dark_cyan-600 focus:ring-dark_cyan-500"
                  />
                  <label
                    htmlFor="notify-start"
                    className="text-sm font-bold text-gray-900"
                  >
                    Notify when job starts
                  </label>
                </div>
              </div>
            </div>
          </CellCard>
        </form>
      </div>
    </PageLayout>
  );
}
