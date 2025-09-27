"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Job, JobStatus } from '../types';

interface JobContextType {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  createJob: (jobData: { name: string; pipelineId: string; schedule: string; enabled?: boolean }) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<Job | null>;
  deleteJob: (id: string) => Promise<boolean>;
  getJob: (id: string) => Job | null;
  refreshJobs: () => Promise<void>;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
}

interface JobProviderProps {
  children: ReactNode;
}

export function JobProvider({ children }: JobProviderProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/jobs?projectId=default');
      if (!response.ok) {
        throw new Error('Failed to fetch jobs');
      }
      
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: { name: string; pipelineId: string; schedule: string; enabled?: boolean }): Promise<Job> => {
    try {
      setError(null);
      
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: 'default',
          ...jobData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      const newJob = await response.json();
      setJobs(prev => [newJob, ...prev]);
      return newJob;
    } catch (err) {
      console.error('Error creating job:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateJob = async (id: string, updates: Partial<Job>): Promise<Job | null> => {
    try {
      setError(null);
      
      const response = await fetch('/api/jobs', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job');
      }

      const updatedJob = await response.json();
      setJobs(prev => 
        prev.map(job => 
          job.id === id ? updatedJob : job
        )
      );
      return updatedJob;
    } catch (err) {
      console.error('Error updating job:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    }
  };

  const deleteJob = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/jobs?jobId=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete job');
      }

      setJobs(prev => prev.filter(job => job.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting job:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    }
  };

  const getJob = (id: string): Job | null => {
    return jobs.find(job => job.id === id) || null;
  };

  // Load jobs on mount
  useEffect(() => {
    refreshJobs();
  }, []);

  const contextValue: JobContextType = {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    getJob,
    refreshJobs,
  };

  return (
    <JobContext.Provider value={contextValue}>
      {children}
    </JobContext.Provider>
  );
}