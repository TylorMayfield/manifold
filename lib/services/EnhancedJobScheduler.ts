/**
 * Enhanced Job Scheduler
 * 
 * Advanced job scheduling system with:
 * - Job dependencies (DAG-based execution)
 * - Retry policies with exponential backoff
 * - SLA monitoring and alerts
 * - Parallel execution controls
 * - Priority queues
 * - Resource management
 */

import { logger } from '../utils/logger';
import cron from 'node-cron';
import { EventEmitter } from 'events';

// ==================== TYPES ====================

export interface EnhancedJob {
  id: string;
  name: string;
  type: 'pipeline' | 'sync' | 'script' | 'backup';
  schedule?: string; // Cron expression
  enabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
  
  // Dependencies
  dependencies?: string[]; // Job IDs that must complete first
  dependencyMode?: 'all' | 'any'; // Wait for all or any dependency
  
  // Retry Policy
  retryPolicy?: RetryPolicy;
  
  // SLA Configuration
  sla?: SLAConfig;
  
  // Execution Limits
  maxConcurrent?: number; // Max parallel instances of this job
  timeout?: number; // Max execution time in ms
  
  // Resource Requirements
  resources?: ResourceRequirements;
  
  // Metadata
  pipelineId?: string;
  dataSourceId?: string;
  config?: Record<string, any>;
  tags?: string[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier?: number; // Exponential backoff (default 2)
  maxRetryDelayMs?: number; // Cap on retry delay
  retryOn?: ('failure' | 'timeout' | 'dependency-failure')[];
}

export interface SLAConfig {
  maxDurationMs: number; // Expected completion time
  alertThresholdPercent?: number; // Alert at X% of max duration
  criticalThresholdPercent?: number; // Critical alert at X%
  notificationChannels?: string[]; // Webhook IDs for alerts
}

export interface ResourceRequirements {
  cpuCores?: number;
  memoryMB?: number;
  concurrentSlots?: number; // Generic resource slots
}

export interface JobExecution {
  id: string;
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  retryCount: number;
  error?: string;
  result?: any;
  
  // Dependencies
  waitingFor?: string[]; // Job execution IDs
  
  // SLA
  slaStatus?: 'ok' | 'warning' | 'critical' | 'breached';
  slaAlerts?: SLAAlert[];
  
  // Resources
  resourcesAllocated?: ResourceRequirements;
}

export interface SLAAlert {
  level: 'warning' | 'critical' | 'breached';
  timestamp: Date;
  message: string;
  percentComplete: number;
}

export interface JobDependencyGraph {
  jobId: string;
  dependencies: string[];
  dependents: string[]; // Jobs that depend on this job
}

export interface ExecutionQueue {
  priority: 'low' | 'normal' | 'high' | 'critical';
  jobs: JobExecution[];
}

// ==================== ENHANCED JOB SCHEDULER ====================

export class EnhancedJobScheduler extends EventEmitter {
  private static instance: EnhancedJobScheduler;
  
  private jobs: Map<string, EnhancedJob> = new Map();
  private executions: Map<string, JobExecution> = new Map();
  private cronTasks: Map<string, cron.ScheduledTask> = new Map();
  
  private executionQueue: Map<string, JobExecution[]> = new Map([
    ['critical', []],
    ['high', []],
    ['normal', []],
    ['low', []],
  ]);
  
  private runningExecutions: Set<string> = new Set();
  private dependencyGraph: Map<string, JobDependencyGraph> = new Map();
  
  private maxGlobalConcurrent: number = 10; // Global parallel job limit
  private availableResources: ResourceRequirements = {
    cpuCores: 8,
    memoryMB: 16384,
    concurrentSlots: 20,
  };
  
  private processingInterval: NodeJS.Timeout | null = null;

  static getInstance(): EnhancedJobScheduler {
    if (!EnhancedJobScheduler.instance) {
      EnhancedJobScheduler.instance = new EnhancedJobScheduler();
    }
    return EnhancedJobScheduler.instance;
  }

  constructor() {
    super();
    this.startQueueProcessor();
  }

  /**
   * Register a job with the scheduler
   */
  registerJob(job: EnhancedJob): void {
    this.jobs.set(job.id, job);
    
    // Build dependency graph
    this.updateDependencyGraph(job);
    
    // Schedule cron if configured
    if (job.schedule && job.enabled) {
      this.scheduleCronJob(job);
    }
    
    logger.info(`Job registered: ${job.name}`, 'job-scheduler', { jobId: job.id });
  }

  /**
   * Unregister a job
   */
  unregisterJob(jobId: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    // Stop cron task
    const cronTask = this.cronTasks.get(jobId);
    if (cronTask) {
      cronTask.stop();
      this.cronTasks.delete(jobId);
    }
    
    // Remove from dependency graph
    this.dependencyGraph.delete(jobId);
    
    this.jobs.delete(jobId);
    
    logger.info(`Job unregistered: ${job.name}`, 'job-scheduler', { jobId });
  }

  /**
   * Queue a job for execution
   */
  async queueJob(jobId: string, triggeredBy?: string): Promise<string> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (!job.enabled) {
      throw new Error(`Job is disabled: ${job.name}`);
    }

    // Create execution
    const execution: JobExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      status: 'queued',
      retryCount: 0,
    };

    this.executions.set(execution.id, execution);

    // Check dependencies
    if (job.dependencies && job.dependencies.length > 0) {
      const waitingFor = await this.checkDependencies(job, execution);
      if (waitingFor.length > 0) {
        execution.waitingFor = waitingFor;
        logger.info(`Job queued, waiting for dependencies`, 'job-scheduler', {
          jobId,
          executionId: execution.id,
          waitingFor,
        });
      }
    }

    // Add to priority queue
    const queue = this.executionQueue.get(job.priority) || [];
    queue.push(execution);
    this.executionQueue.set(job.priority, queue);

    this.emit('job:queued', { job, execution });

    logger.info(`Job queued: ${job.name}`, 'job-scheduler', {
      jobId,
      executionId: execution.id,
      priority: job.priority,
    });

    return execution.id;
  }

  /**
   * Execute a job
   */
  private async executeJob(execution: JobExecution): Promise<void> {
    const job = this.jobs.get(execution.jobId);
    if (!job) {
      execution.status = 'failed';
      execution.error = 'Job not found';
      return;
    }

    execution.status = 'running';
    execution.startTime = new Date();
    this.runningExecutions.add(execution.id);

    // Allocate resources
    if (job.resources) {
      execution.resourcesAllocated = job.resources;
      this.allocateResources(job.resources);
    }

    this.emit('job:started', { job, execution });

    logger.info(`Job started: ${job.name}`, 'job-scheduler', {
      jobId: job.id,
      executionId: execution.id,
    });

    // Start SLA monitoring
    if (job.sla) {
      this.startSLAMonitoring(job, execution);
    }

    // Set timeout
    let timeoutHandle: NodeJS.Timeout | undefined;
    if (job.timeout) {
      timeoutHandle = setTimeout(() => {
        this.handleJobTimeout(job, execution);
      }, job.timeout);
    }

    try {
      // Execute the actual job
      const result = await this.runJobLogic(job, execution);

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime!.getTime();
      execution.result = result;
      execution.slaStatus = this.checkSLAStatus(job, execution);

      if (timeoutHandle) clearTimeout(timeoutHandle);

      this.emit('job:completed', { job, execution });

      logger.success(`Job completed: ${job.name}`, 'job-scheduler', {
        jobId: job.id,
        executionId: execution.id,
        duration: execution.duration,
        slaStatus: execution.slaStatus,
      });

      // Trigger dependent jobs
      await this.triggerDependentJobs(job.id, execution.id);

    } catch (error) {
      if (timeoutHandle) clearTimeout(timeoutHandle);

      execution.status = 'failed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime!.getTime();
      execution.error = error instanceof Error ? error.message : String(error);

      this.emit('job:failed', { job, execution, error });

      logger.error(`Job failed: ${job.name}`, 'job-scheduler', {
        jobId: job.id,
        executionId: execution.id,
        error: execution.error,
      });

      // Handle retry
      await this.handleJobRetry(job, execution);

    } finally {
      this.runningExecutions.delete(execution.id);
      
      // Release resources
      if (execution.resourcesAllocated) {
        this.releaseResources(execution.resourcesAllocated);
      }
    }
  }

  /**
   * Run the actual job logic
   */
  private async runJobLogic(job: EnhancedJob, execution: JobExecution): Promise<any> {
    // This would call the appropriate executor based on job type
    switch (job.type) {
      case 'pipeline':
        // Execute pipeline
        if (job.pipelineId) {
          const response = await fetch(`/api/pipelines/${job.pipelineId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ executionId: execution.id }),
          });
          return await response.json();
        }
        break;
      
      case 'sync':
        // Perform data sync
        if (job.dataSourceId) {
          const response = await fetch(`/api/data-sources/${job.dataSourceId}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          return await response.json();
        }
        break;
      
      case 'script':
        // Execute custom script
        // Implementation would go here
        break;
      
      case 'backup':
        // Perform backup
        // Implementation would go here
        break;
    }

    return { success: true };
  }

  /**
   * Handle job timeout
   */
  private handleJobTimeout(job: EnhancedJob, execution: JobExecution): void {
    execution.status = 'timeout';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime!.getTime();
    execution.error = `Job timeout after ${job.timeout}ms`;

    this.emit('job:timeout', { job, execution });

    logger.warn(`Job timeout: ${job.name}`, 'job-scheduler', {
      jobId: job.id,
      executionId: execution.id,
      timeout: job.timeout,
    });

    // Handle retry for timeout
    this.handleJobRetry(job, execution);
  }

  /**
   * Handle job retry with exponential backoff
   */
  private async handleJobRetry(job: EnhancedJob, execution: JobExecution): Promise<void> {
    const retryPolicy = job.retryPolicy;
    if (!retryPolicy) return;

    if (execution.retryCount >= retryPolicy.maxRetries) {
      logger.error(`Job retry limit reached: ${job.name}`, 'job-scheduler', {
        jobId: job.id,
        executionId: execution.id,
        retryCount: execution.retryCount,
      });
      return;
    }

    // Check if we should retry for this error type
    if (retryPolicy.retryOn) {
      const shouldRetry = retryPolicy.retryOn.some(condition => {
        if (condition === 'failure' && execution.status === 'failed') return true;
        if (condition === 'timeout' && execution.status === 'timeout') return true;
        return false;
      });

      if (!shouldRetry) return;
    }

    // Calculate retry delay with exponential backoff
    const backoffMultiplier = retryPolicy.backoffMultiplier || 2;
    const retryDelay = Math.min(
      retryPolicy.retryDelayMs * Math.pow(backoffMultiplier, execution.retryCount),
      retryPolicy.maxRetryDelayMs || Infinity
    );

    execution.retryCount++;

    logger.info(`Scheduling job retry: ${job.name}`, 'job-scheduler', {
      jobId: job.id,
      executionId: execution.id,
      retryCount: execution.retryCount,
      retryDelay,
    });

    // Schedule retry
    setTimeout(() => {
      execution.status = 'queued';
      execution.error = undefined;
      const queue = this.executionQueue.get(job.priority) || [];
      queue.unshift(execution); // Add to front of queue for priority
      this.executionQueue.set(job.priority, queue);
    }, retryDelay);
  }

  /**
   * Check job dependencies
   */
  private async checkDependencies(job: EnhancedJob, execution: JobExecution): Promise<string[]> {
    if (!job.dependencies || job.dependencies.length === 0) {
      return [];
    }

    const waitingFor: string[] = [];

    for (const depJobId of job.dependencies) {
      // Find most recent execution of dependency job
      const depExecutions = Array.from(this.executions.values())
        .filter(e => e.jobId === depJobId)
        .sort((a, b) => {
          const timeA = a.startTime?.getTime() || 0;
          const timeB = b.startTime?.getTime() || 0;
          return timeB - timeA;
        });

      if (depExecutions.length === 0) {
        waitingFor.push(depJobId);
        continue;
      }

      const latestExec = depExecutions[0];

      if (latestExec.status === 'running' || latestExec.status === 'queued') {
        waitingFor.push(latestExec.id);
      } else if (latestExec.status === 'failed') {
        if (job.dependencyMode === 'all') {
          throw new Error(`Dependency job failed: ${depJobId}`);
        }
      }
    }

    return waitingFor;
  }

  /**
   * Trigger jobs that depend on this job
   */
  private async triggerDependentJobs(jobId: string, executionId: string): Promise<void> {
    const graph = this.dependencyGraph.get(jobId);
    if (!graph || graph.dependents.length === 0) return;

    for (const dependentJobId of graph.dependents) {
      const dependentJob = this.jobs.get(dependentJobId);
      if (!dependentJob || !dependentJob.enabled) continue;

      // Check if all dependencies are now satisfied
      const waitingExecutions = Array.from(this.executions.values())
        .filter(e => 
          e.status === 'queued' && 
          e.jobId === dependentJobId &&
          e.waitingFor?.includes(executionId)
        );

      for (const execution of waitingExecutions) {
        // Remove this dependency from waiting list
        execution.waitingFor = execution.waitingFor?.filter(id => id !== executionId);

        // If no more dependencies, job can be executed
        if (!execution.waitingFor || execution.waitingFor.length === 0) {
          logger.info(`Dependencies satisfied for job: ${dependentJob.name}`, 'job-scheduler', {
            jobId: dependentJobId,
            executionId: execution.id,
          });
        }
      }
    }
  }

  /**
   * Start SLA monitoring
   */
  private startSLAMonitoring(job: EnhancedJob, execution: JobExecution): void {
    if (!job.sla) return;

    const checkInterval = Math.floor(job.sla.maxDurationMs / 10); // Check every 10%

    const intervalHandle = setInterval(() => {
      if (execution.status !== 'running') {
        clearInterval(intervalHandle);
        return;
      }

      const elapsed = Date.now() - execution.startTime!.getTime();
      const percentComplete = (elapsed / job.sla!.maxDurationMs) * 100;

      // Check alert thresholds
      if (job.sla!.criticalThresholdPercent && percentComplete >= job.sla!.criticalThresholdPercent) {
        this.emitSLAAlert(job, execution, 'critical', percentComplete);
      } else if (job.sla!.alertThresholdPercent && percentComplete >= job.sla!.alertThresholdPercent) {
        this.emitSLAAlert(job, execution, 'warning', percentComplete);
      }

      // Check for breach
      if (elapsed >= job.sla!.maxDurationMs) {
        this.emitSLAAlert(job, execution, 'breached', percentComplete);
        clearInterval(intervalHandle);
      }
    }, checkInterval);
  }

  /**
   * Emit SLA alert
   */
  private emitSLAAlert(
    job: EnhancedJob,
    execution: JobExecution,
    level: 'warning' | 'critical' | 'breached',
    percentComplete: number
  ): void {
    const alert: SLAAlert = {
      level,
      timestamp: new Date(),
      message: `Job ${job.name} ${level === 'breached' ? 'breached' : 'approaching'} SLA (${percentComplete.toFixed(1)}%)`,
      percentComplete,
    };

    if (!execution.slaAlerts) {
      execution.slaAlerts = [];
    }
    execution.slaAlerts.push(alert);

    this.emit('sla:alert', { job, execution, alert });

    logger.warn(`SLA Alert: ${alert.message}`, 'job-scheduler', {
      jobId: job.id,
      executionId: execution.id,
      level,
      percentComplete,
    });
  }

  /**
   * Check SLA status after completion
   */
  private checkSLAStatus(job: EnhancedJob, execution: JobExecution): 'ok' | 'warning' | 'critical' | 'breached' {
    if (!job.sla || !execution.duration) return 'ok';

    const percentOfSLA = (execution.duration / job.sla.maxDurationMs) * 100;

    if (percentOfSLA >= 100) return 'breached';
    if (job.sla.criticalThresholdPercent && percentOfSLA >= job.sla.criticalThresholdPercent) return 'critical';
    if (job.sla.alertThresholdPercent && percentOfSLA >= job.sla.alertThresholdPercent) return 'warning';

    return 'ok';
  }

  /**
   * Update dependency graph
   */
  private updateDependencyGraph(job: EnhancedJob): void {
    const graph: JobDependencyGraph = {
      jobId: job.id,
      dependencies: job.dependencies || [],
      dependents: [],
    };

    // Update this job's graph
    this.dependencyGraph.set(job.id, graph);

    // Update dependent jobs' graphs
    if (job.dependencies) {
      for (const depJobId of job.dependencies) {
        const depGraph = this.dependencyGraph.get(depJobId) || {
          jobId: depJobId,
          dependencies: [],
          dependents: [],
        };
        
        if (!depGraph.dependents.includes(job.id)) {
          depGraph.dependents.push(job.id);
        }
        
        this.dependencyGraph.set(depJobId, depGraph);
      }
    }
  }

  /**
   * Schedule cron job
   */
  private scheduleCronJob(job: EnhancedJob): void {
    if (!job.schedule) return;

    try {
      const task = cron.schedule(job.schedule, () => {
        this.queueJob(job.id, 'cron').catch(error => {
          logger.error(`Failed to queue cron job: ${job.name}`, 'job-scheduler', { error });
        });
      });

      this.cronTasks.set(job.id, task);

      logger.info(`Cron job scheduled: ${job.name}`, 'job-scheduler', {
        jobId: job.id,
        schedule: job.schedule,
      });

    } catch (error) {
      logger.error(`Failed to schedule cron job: ${job.name}`, 'job-scheduler', {
        jobId: job.id,
        error,
      });
    }
  }

  /**
   * Process execution queue
   */
  private startQueueProcessor(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000); // Check every second
  }

  /**
   * Process jobs from queue
   */
  private async processQueue(): Promise<void> {
    // Check if we can run more jobs
    if (this.runningExecutions.size >= this.maxGlobalConcurrent) {
      return;
    }

    // Process queues by priority
    const priorities: ('critical' | 'high' | 'normal' | 'low')[] = ['critical', 'high', 'normal', 'low'];

    for (const priority of priorities) {
      const queue = this.executionQueue.get(priority) || [];
      
      // Find jobs ready to execute (no dependencies or dependencies met)
      const readyJobs = queue.filter(exec => {
        if (exec.status !== 'queued') return false;
        if (!exec.waitingFor || exec.waitingFor.length === 0) return true;
        return false;
      });

      for (const execution of readyJobs) {
        if (this.runningExecutions.size >= this.maxGlobalConcurrent) {
          break;
        }

        const job = this.jobs.get(execution.jobId);
        if (!job) continue;

        // Check resource availability
        if (job.resources && !this.hasAvailableResources(job.resources)) {
          continue;
        }

        // Check max concurrent for this job
        if (job.maxConcurrent) {
          const runningCount = Array.from(this.runningExecutions.values())
            .filter(id => {
              const exec = this.executions.get(id);
              return exec?.jobId === job.id;
            }).length;

          if (runningCount >= job.maxConcurrent) {
            continue;
          }
        }

        // Remove from queue and execute
        const index = queue.indexOf(execution);
        queue.splice(index, 1);

        this.executeJob(execution).catch(error => {
          logger.error(`Job execution error: ${job.name}`, 'job-scheduler', { error });
        });
      }
    }
  }

  /**
   * Resource management
   */
  private allocateResources(resources: ResourceRequirements): void {
    if (resources.cpuCores) {
      this.availableResources.cpuCores! -= resources.cpuCores;
    }
    if (resources.memoryMB) {
      this.availableResources.memoryMB! -= resources.memoryMB;
    }
    if (resources.concurrentSlots) {
      this.availableResources.concurrentSlots! -= resources.concurrentSlots;
    }
  }

  private releaseResources(resources: ResourceRequirements): void {
    if (resources.cpuCores) {
      this.availableResources.cpuCores! += resources.cpuCores;
    }
    if (resources.memoryMB) {
      this.availableResources.memoryMB! += resources.memoryMB;
    }
    if (resources.concurrentSlots) {
      this.availableResources.concurrentSlots! += resources.concurrentSlots;
    }
  }

  private hasAvailableResources(required: ResourceRequirements): boolean {
    if (required.cpuCores && required.cpuCores > this.availableResources.cpuCores!) {
      return false;
    }
    if (required.memoryMB && required.memoryMB > this.availableResources.memoryMB!) {
      return false;
    }
    if (required.concurrentSlots && required.concurrentSlots > this.availableResources.concurrentSlots!) {
      return false;
    }
    return true;
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): EnhancedJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): EnhancedJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): JobExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get executions for a job
   */
  getJobExecutions(jobId: string): JobExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.jobId === jobId)
      .sort((a, b) => {
        const timeA = a.startTime?.getTime() || 0;
        const timeB = b.startTime?.getTime() || 0;
        return timeB - timeA;
      });
  }

  /**
   * Get dependency graph for a job
   */
  getDependencyGraph(jobId: string): JobDependencyGraph | undefined {
    return this.dependencyGraph.get(jobId);
  }

  /**
   * Cancel a running job
   */
  async cancelJob(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution) return false;

    if (execution.status === 'running') {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - (execution.startTime?.getTime() || 0);

      const job = this.jobs.get(execution.jobId);
      this.emit('job:cancelled', { job, execution });

      logger.info(`Job cancelled`, 'job-scheduler', {
        jobId: execution.jobId,
        executionId,
      });

      return true;
    }

    return false;
  }

  /**
   * Shutdown scheduler
   */
  shutdown(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    for (const [jobId, task] of this.cronTasks) {
      task.stop();
    }

    logger.info('Job scheduler shutdown', 'job-scheduler');
  }
}

// Export singleton instance
export const enhancedJobScheduler = EnhancedJobScheduler.getInstance();

