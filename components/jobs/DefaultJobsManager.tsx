"use client";

import React, { useState, useEffect } from "react";
import { Clock, Database, Shield, Play, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import CellButton from "../ui/CellButton";
import CellCard from "../ui/CellCard";

interface JobStatus {
  configBackupJob: any;
  integrityCheckJob: any;
}

interface JobResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export default function DefaultJobsManager() {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<{
    backup?: JobResult;
    integrity?: JobResult;
  }>({});

  useEffect(() => {
    loadJobStatus();
  }, []);

  const loadJobStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/jobs/default?action=status');
      const status = await response.json();
      setJobStatus(status);
    } catch (error) {
      console.error('Failed to load job status:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultJobs = async () => {
    try {
      setLoading(true);
      await fetch('/api/jobs/default?action=create', { method: 'GET' });
      await loadJobStatus();
    } catch (error) {
      console.error('Failed to create default jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const runJobManually = async (jobType: 'backup' | 'integrity_check') => {
    try {
      setRunningJob(jobType);
      const response = await fetch('/api/jobs/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', jobType })
      });
      
      const result = await response.json();
      setLastResults(prev => ({ ...prev, [jobType]: result }));
      
      // Reload status to get updated job information
      await loadJobStatus();
    } catch (error) {
      console.error(`Failed to run ${jobType} job:`, error);
    } finally {
      setRunningJob(null);
    }
  };

  const getStatusIcon = (job: any) => {
    if (!job) return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    
    switch (job.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (job: any) => {
    if (!job) return "Not Created";
    
    switch (job.status) {
      case 'completed':
        return "Completed";
      case 'failed':
        return "Failed";
      case 'running':
        return "Running";
      default:
        return "Idle";
    }
  };

  const getLastRunText = (job: any) => {
    if (!job || !job.lastRun) return "Never";
    return new Date(job.lastRun).toLocaleString();
  };

  if (loading && !jobStatus) {
    return (
      <CellCard className="p-6">
        <h2 className="text-subheading font-bold mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          System Jobs
        </h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-body text-gray-600">Loading job status...</p>
        </div>
      </CellCard>
    );
  }

  const hasJobs = jobStatus?.configBackupJob || jobStatus?.integrityCheckJob;

  return (
    <CellCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-subheading font-bold flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          System Jobs
        </h2>
        
        {!hasJobs && (
          <CellButton
            onClick={createDefaultJobs}
            variant="primary"
            size="sm"
          >
            Create Default Jobs
          </CellButton>
        )}
      </div>

      {!hasJobs ? (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-body font-bold mb-2">No System Jobs Created</h3>
          <p className="text-caption text-gray-600 mb-4">
            Create default system jobs for backup and integrity checking
          </p>
          <CellButton
            onClick={createDefaultJobs}
            variant="primary"
          >
            Create Default Jobs
          </CellButton>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Config Backup Job */}
          <div className="border-2 border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Database className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <h3 className="text-body font-bold">Core Config Backup</h3>
                  <p className="text-caption text-gray-600">
                    Daily backup of configuration database
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusIcon(jobStatus?.configBackupJob)}
                <span className="text-caption">
                  {getStatusText(jobStatus?.configBackupJob)}
                </span>
                <CellButton
                  onClick={() => runJobManually('backup')}
                  variant="ghost"
                  size="sm"
                  disabled={runningJob === 'backup'}
                >
                  {runningJob === 'backup' ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </CellButton>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-caption">
              <div>
                <span className="font-bold">Schedule:</span> Daily at 2:00 AM
              </div>
              <div>
                <span className="font-bold">Last Run:</span> {getLastRunText(jobStatus?.configBackupJob)}
              </div>
            </div>

            {lastResults.backup && (
              <div className={`mt-3 p-3 border rounded ${
                lastResults.backup.success 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center mb-2">
                  {lastResults.backup.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mr-2" />
                  )}
                  <span className="text-caption font-bold">
                    {lastResults.backup.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className="text-caption">{lastResults.backup.message}</p>
                {lastResults.backup.details && (
                  <div className="mt-2 text-caption">
                    <p>Duration: {lastResults.backup.details.duration}ms</p>
                    {lastResults.backup.details.backupSize && (
                      <p>Size: {(lastResults.backup.details.backupSize / 1024).toFixed(1)} KB</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Integrity Check Job */}
          <div className="border-2 border-black p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-3 text-green-600" />
                <div>
                  <h3 className="text-body font-bold">Data Source Integrity Check</h3>
                  <p className="text-caption text-gray-600">
                    Weekly verification of metadata vs disk files
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusIcon(jobStatus?.integrityCheckJob)}
                <span className="text-caption">
                  {getStatusText(jobStatus?.integrityCheckJob)}
                </span>
                <CellButton
                  onClick={() => runJobManually('integrity_check')}
                  variant="ghost"
                  size="sm"
                  disabled={runningJob === 'integrity_check'}
                >
                  {runningJob === 'integrity_check' ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </CellButton>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-caption">
              <div>
                <span className="font-bold">Schedule:</span> Weekly (Sunday 3:00 AM)
              </div>
              <div>
                <span className="font-bold">Last Run:</span> {getLastRunText(jobStatus?.integrityCheckJob)}
              </div>
            </div>

            {lastResults.integrity && (
              <div className={`mt-3 p-3 border rounded ${
                lastResults.integrity.success 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center mb-2">
                  {lastResults.integrity.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 mr-2" />
                  )}
                  <span className="text-caption font-bold">
                    {lastResults.integrity.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className="text-caption">{lastResults.integrity.message}</p>
                {lastResults.integrity.details && (
                  <div className="mt-2 text-caption">
                    <p>Projects Checked: {lastResults.integrity.details.projectsChecked}</p>
                    <p>Data Sources: {lastResults.integrity.details.totalDataSources}</p>
                    <p>Issues Found: {lastResults.integrity.details.issuesFound}</p>
                    {lastResults.integrity.details.issues && (
                      <div className="mt-2">
                        <p className="font-bold">Issues:</p>
                        <ul className="list-disc list-inside text-xs">
                          {lastResults.integrity.details.issues.slice(0, 3).map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                          {lastResults.integrity.details.issues.length > 3 && (
                            <li>...and {lastResults.integrity.details.issues.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-center pt-4">
            <CellButton
              onClick={loadJobStatus}
              variant="ghost"
              size="sm"
              disabled={loading}
            >
              {loading ? (
                <Clock className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Refresh Status
            </CellButton>
          </div>
        </div>
      )}
    </CellCard>
  );
}
