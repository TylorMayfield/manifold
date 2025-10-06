"use client";

import React from 'react';
import SystemHealthDashboard from '../../components/monitoring/SystemHealthDashboard';
import MetricsChart from '../../components/monitoring/MetricsChart';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <SystemHealthDashboard />

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricsChart
            metricName="system.cpu_usage"
            title="CPU Usage"
            unit="%"
            thresholds={{ warning: 70, critical: 90 }}
          />
          <MetricsChart
            metricName="system.memory_usage"
            title="Memory Usage"
            unit="%"
            thresholds={{ warning: 70, critical: 85 }}
          />
          <MetricsChart
            metricName="pipelines.execution_time"
            title="Pipeline Execution"
            unit="ms"
          />
        </div>
      </div>
    </div>
  );
}

