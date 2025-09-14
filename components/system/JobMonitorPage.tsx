"use client";

import React, { useState } from "react";
import { ArrowLeft, Settings, Play, Pause, RotateCcw } from "lucide-react";
import JobMonitor from "./JobMonitor";
import Button from "../ui/Button";

interface JobMonitorPageProps {
  onBack: () => void;
}

export default function JobMonitorPage({ onBack }: JobMonitorPageProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "running" | "scheduled" | "history"
  >("overview");

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white border-opacity-10">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onBack}
            variant="ghost"
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Job Monitor</h1>
            <p className="text-white/60 text-sm">
              Monitor and manage scheduled tasks and data processing jobs
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" icon={<Settings className="h-4 w-4" />}>
            Settings
          </Button>
          <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />}>
            Refresh All
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-4 border-b border-white border-opacity-10">
        <nav className="flex space-x-6">
          {[
            { id: "overview", label: "Overview" },
            { id: "running", label: "Running Jobs" },
            { id: "scheduled", label: "Scheduled Tasks" },
            { id: "history", label: "History" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "text-white bg-white/10"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Main Job Monitor */}
            <JobMonitor className="max-w-4xl" />

            {/* Quick Actions */}
            <div className="max-w-4xl">
              <h2 className="text-lg font-semibold text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-400/20">
                      <Play className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        Start All Paused
                      </h3>
                      <p className="text-white/60 text-sm">
                        Resume all paused scheduled tasks
                      </p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    Start All
                  </Button>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-yellow-400/20">
                      <Pause className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">
                        Pause All Running
                      </h3>
                      <p className="text-white/60 text-sm">
                        Temporarily pause running tasks
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Pause All
                  </Button>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-green-400/20">
                      <RotateCcw className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Clear History</h3>
                      <p className="text-white/60 text-sm">
                        Clear completed task history
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full">
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "running" && (
          <div className="max-w-4xl">
            <JobMonitor className="mb-6" />
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Running Jobs Details
              </h2>
              <div className="space-y-4">
                {/* This would show detailed information about running jobs */}
                <div className="text-center py-8">
                  <div className="text-white/60">No jobs currently running</div>
                  <div className="text-white/40 text-sm mt-2">
                    Scheduled tasks will appear here when they start executing
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "scheduled" && (
          <div className="max-w-4xl">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Scheduled Tasks
              </h2>
              <div className="space-y-4">
                {/* This would show detailed information about scheduled tasks */}
                <div className="text-center py-8">
                  <div className="text-white/60">
                    No scheduled tasks configured
                  </div>
                  <div className="text-white/40 text-sm mt-2">
                    Set up data source sync schedules or backup schedules to see
                    tasks here
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-4xl">
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Task History
              </h2>
              <div className="space-y-4">
                {/* This would show detailed task history */}
                <div className="text-center py-8">
                  <div className="text-white/60">No task history available</div>
                  <div className="text-white/40 text-sm mt-2">
                    Task execution history will appear here as jobs complete
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
