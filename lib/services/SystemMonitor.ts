import { logger } from "../utils/logger";

export interface SystemMetrics {
  cpu: {
    usage: number; // Percentage (0-100)
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number; // Bytes
    used: number; // Bytes
    free: number; // Bytes
    usage: number; // Percentage (0-100)
  };
  disk: {
    total: number; // Bytes
    used: number; // Bytes
    free: number; // Bytes
    usage: number; // Percentage (0-100)
  };
  uptime: number; // Seconds
  timestamp: Date;
}

export interface ScheduledTask {
  id: string;
  name: string;
  type: "backup" | "sync" | "custom_script" | "api_poll";
  schedule: string; // Cron expression
  nextRun: Date;
  lastRun?: Date;
  status: "pending" | "running" | "completed" | "failed" | "paused";
  dataSourceId?: string;
  projectId?: string;
  metadata?: any;
  // Enhanced tracking
  startedAt?: Date;
  estimatedDuration?: number; // in seconds
  progress?: number; // 0-100
  currentStep?: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  taskName: string;
  type: "backup" | "sync" | "custom_script" | "api_poll";
  startedAt: Date;
  completedAt?: Date;
  status: "running" | "completed" | "failed";
  duration?: number; // Milliseconds
  error?: string;
  metadata?: any;
}

export class SystemMonitor {
  private static instance: SystemMonitor;
  protected metrics: SystemMetrics | null = null;
  protected scheduledTasks: ScheduledTask[] = [];
  protected taskHistory: TaskHistory[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private isElectron: boolean = false;

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  constructor() {
    this.isElectron = typeof window !== "undefined" && (window as any).electron;
    this.initializeScheduledTasks();
    this.loadTaskHistory();
  }

  /**
   * Start monitoring system metrics
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, intervalMs);

    // Initial update
    this.updateMetrics();

    logger.info(
      "System monitoring started",
      "system",
      { intervalMs },
      "SystemMonitor"
    );
  }

  /**
   * Stop monitoring system metrics
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    logger.info("System monitoring stopped", "system", {}, "SystemMonitor");
  }

  /**
   * Get current system metrics
   */
  getMetrics(): SystemMetrics | null {
    return this.metrics;
  }

  /**
   * Get scheduled tasks
   */
  getScheduledTasks(): ScheduledTask[] {
    return this.scheduledTasks;
  }

  /**
   * Get task history
   */
  getTaskHistory(limit: number = 50): TaskHistory[] {
    return this.taskHistory
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Start a scheduled task
   */
  startTask(taskId: string): boolean {
    const task = this.scheduledTasks.find((t) => t.id === taskId);
    if (!task || task.status !== "pending") {
      return false;
    }

    task.status = "running";
    task.startedAt = new Date();
    task.progress = 0;
    task.currentStep = "Starting...";

    this.saveScheduledTasks();

    // Add to history
    this.addTaskHistory({
      taskId: task.id,
      taskName: task.name,
      type: task.type,
      startedAt: task.startedAt,
      status: "running",
    });

    logger.info(
      "Task started",
      "system",
      { taskId, taskName: task.name },
      "SystemMonitor"
    );
    return true;
  }

  /**
   * Update task progress
   */
  updateTaskProgress(
    taskId: string,
    progress: number,
    currentStep?: string
  ): boolean {
    const task = this.scheduledTasks.find((t) => t.id === taskId);
    if (!task || task.status !== "running") {
      return false;
    }

    task.progress = Math.max(0, Math.min(100, progress));
    if (currentStep) {
      task.currentStep = currentStep;
    }

    this.saveScheduledTasks();
    return true;
  }

  /**
   * Complete a task
   */
  completeTask(
    taskId: string,
    success: boolean = true,
    error?: string
  ): boolean {
    const task = this.scheduledTasks.find((t) => t.id === taskId);
    if (!task || task.status !== "running") {
      return false;
    }

    task.status = success ? "completed" : "failed";
    task.lastRun = new Date();
    task.progress = 100;
    task.currentStep = success ? "Completed" : "Failed";

    // Calculate next run time
    task.nextRun = this.calculateNextRun(task.schedule, new Date());

    this.saveScheduledTasks();

    // Update history
    const historyEntry = this.taskHistory.find(
      (h) => h.taskId === taskId && h.status === "running"
    );
    if (historyEntry) {
      historyEntry.status = success ? "completed" : "failed";
      historyEntry.completedAt = new Date();
      if (historyEntry.startedAt) {
        historyEntry.duration = Math.round(
          (historyEntry.completedAt.getTime() -
            historyEntry.startedAt.getTime()) /
            1000
        );
      }
      if (error) {
        historyEntry.error = error;
      }
      this.saveTaskHistory();
    }

    logger.info(
      "Task completed",
      "system",
      {
        taskId,
        taskName: task.name,
        success,
        duration: historyEntry?.duration,
      },
      "SystemMonitor"
    );
    return true;
  }

  /**
   * Get job status summary
   */
  getJobStatusSummary(): {
    running: number;
    pending: number;
    completed: number;
    failed: number;
    paused: number;
  } {
    const scheduled = this.scheduledTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const history = this.taskHistory.reduce((acc, task) => {
      if (task.status === "completed" || task.status === "failed") {
        acc[task.status] = (acc[task.status] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      running: scheduled.running || 0,
      pending: scheduled.pending || 0,
      completed: history.completed || 0,
      failed: history.failed || 0,
      paused: scheduled.paused || 0,
    };
  }

  /**
   * Get currently running tasks
   */
  getRunningTasks(): ScheduledTask[] {
    return this.scheduledTasks.filter((task) => task.status === "running");
  }

  /**
   * Get upcoming tasks (next 24 hours)
   */
  getUpcomingTasks(): ScheduledTask[] {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.scheduledTasks
      .filter((task) => task.status === "pending" && task.nextRun <= tomorrow)
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime());
  }

  /**
   * Add a scheduled task
   */
  addScheduledTask(task: Omit<ScheduledTask, "id">): ScheduledTask {
    const newTask: ScheduledTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.scheduledTasks.push(newTask);
    this.saveScheduledTasks();

    logger.info(
      "Scheduled task added",
      "system",
      { taskId: newTask.id, taskName: newTask.name },
      "SystemMonitor"
    );

    return newTask;
  }

  /**
   * Remove a scheduled task
   */
  removeScheduledTask(taskId: string): boolean {
    const index = this.scheduledTasks.findIndex((task) => task.id === taskId);
    if (index !== -1) {
      this.scheduledTasks.splice(index, 1);
      this.saveScheduledTasks();

      logger.info(
        "Scheduled task removed",
        "system",
        { taskId },
        "SystemMonitor"
      );

      return true;
    }
    return false;
  }

  /**
   * Update task status
   */
  updateTaskStatus(
    taskId: string,
    status: ScheduledTask["status"],
    metadata?: any
  ): void {
    const task = this.scheduledTasks.find((t) => t.id === taskId);
    if (task) {
      task.status = status;
      if (metadata) {
        task.metadata = metadata;
      }

      // Update last run time for completed/failed tasks
      if (status === "completed" || status === "failed") {
        task.lastRun = new Date();
      }

      this.saveScheduledTasks();
    }
  }

  /**
   * Add task to history
   */
  addTaskHistory(history: Omit<TaskHistory, "id">): TaskHistory {
    const newHistory: TaskHistory = {
      ...history,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.taskHistory.unshift(newHistory);

    // Keep only last 1000 entries
    if (this.taskHistory.length > 1000) {
      this.taskHistory = this.taskHistory.slice(0, 1000);
    }

    this.saveTaskHistory();

    logger.info(
      "Task history added",
      "system",
      { historyId: newHistory.id, taskName: newHistory.taskName },
      "SystemMonitor"
    );

    return newHistory;
  }

  /**
   * Update system metrics
   */
  protected async updateMetrics(): Promise<void> {
    try {
      if (this.isElectron && (window as any).electron?.getSystemMetrics) {
        // Use Electron API for real system metrics
        const metrics = await (window as any).electron.getSystemMetrics();
        this.metrics = {
          ...metrics,
          timestamp: new Date(),
        };
      } else {
        // Fallback to browser-based estimation
        this.metrics = await this.getBrowserMetrics();
      }

      // Update scheduled tasks next run times
      this.updateScheduledTasks();
    } catch (error) {
      logger.error(
        "Failed to update system metrics",
        "system",
        { error },
        "SystemMonitor"
      );
    }
  }

  /**
   * Get browser-based metrics (estimation)
   */
  protected async getBrowserMetrics(): Promise<SystemMetrics> {
    // Browser-based estimation
    const memoryInfo = (performance as any).memory;
    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;

    const totalMemory = memoryInfo?.jsHeapSizeLimit || 4294967296; // 4GB default
    const usedMemory = memoryInfo?.usedJSHeapSize || 0;
    const freeMemory = totalMemory - usedMemory;

    return {
      cpu: {
        usage: Math.random() * 30 + 10, // Simulate 10-40% CPU usage
        cores: navigator.hardwareConcurrency || 4,
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
      },
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
        usage: (usedMemory / totalMemory) * 100,
      },
      disk: {
        total: 100000000000, // 100GB default
        used: 50000000000, // 50GB default
        free: 50000000000, // 50GB default
        usage: 50, // 50% default
      },
      uptime: navigation ? Date.now() - navigation.loadEventEnd : 0,
      timestamp: new Date(),
    };
  }

  /**
   * Initialize scheduled tasks from storage
   */
  protected initializeScheduledTasks(): void {
    try {
      const stored = localStorage.getItem("manifold_scheduled_tasks");
      if (stored) {
        const tasks = JSON.parse(stored);
        this.scheduledTasks = tasks.map((task: any) => ({
          ...task,
          nextRun: new Date(task.nextRun),
          lastRun: task.lastRun ? new Date(task.lastRun) : undefined,
        }));
      } else {
        // Add some default tasks for demo
        this.addDefaultTasks();
      }
    } catch (error) {
      logger.error(
        "Failed to initialize scheduled tasks",
        "system",
        { error },
        "SystemMonitor"
      );
    }
  }

  /**
   * Add default demo tasks
   */
  private addDefaultTasks(): void {
    const now = new Date();

    this.scheduledTasks = [
      {
        id: "backup_daily",
        name: "Daily Backup",
        type: "backup",
        schedule: "0 2 * * *", // 2 AM daily
        nextRun: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        status: "pending",
        projectId: "demo_project",
      },
      {
        id: "mysql_sync_hourly",
        name: "MySQL Hourly Sync",
        type: "sync",
        schedule: "0 * * * *", // Every hour
        nextRun: new Date(now.getTime() + 60 * 60 * 1000),
        status: "pending",
        dataSourceId: "mysql_demo",
        projectId: "demo_project",
      },
      {
        id: "api_poll_5min",
        name: "API Poll (5min)",
        type: "api_poll",
        schedule: "*/5 * * * *", // Every 5 minutes
        nextRun: new Date(now.getTime() + 5 * 60 * 1000),
        status: "pending",
        dataSourceId: "api_demo",
        projectId: "demo_project",
      },
    ];

    this.saveScheduledTasks();
  }

  /**
   * Load task history from storage
   */
  protected loadTaskHistory(): void {
    try {
      const stored = localStorage.getItem("manifold_task_history");
      if (stored) {
        const history = JSON.parse(stored);
        this.taskHistory = history.map((item: any) => ({
          ...item,
          startedAt: new Date(item.startedAt),
          completedAt: item.completedAt
            ? new Date(item.completedAt)
            : undefined,
        }));
      } else {
        // Add some demo history
        this.addDemoHistory();
      }
    } catch (error) {
      logger.error(
        "Failed to load task history",
        "system",
        { error },
        "SystemMonitor"
      );
    }
  }

  /**
   * Add demo task history
   */
  private addDemoHistory(): void {
    const now = new Date();
    const tasks = [
      "Daily Backup",
      "MySQL Hourly Sync",
      "API Poll (5min)",
      "Custom Script",
    ];

    this.taskHistory = Array.from({ length: 20 }, (_, i) => {
      const taskName = tasks[Math.floor(Math.random() * tasks.length)];
      const startedAt = new Date(
        now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
      ); // Last 7 days
      const duration = Math.random() * 30000 + 1000; // 1-30 seconds
      const completedAt = new Date(startedAt.getTime() + duration);
      const status = Math.random() > 0.1 ? "completed" : "failed";

      return {
        id: `demo_history_${i}`,
        taskId: `demo_task_${i}`,
        taskName,
        type: taskName.includes("Backup")
          ? "backup"
          : taskName.includes("MySQL")
          ? "sync"
          : taskName.includes("API")
          ? "api_poll"
          : "custom_script",
        startedAt,
        completedAt: status === "completed" ? completedAt : undefined,
        status: status as "completed" | "failed",
        duration: status === "completed" ? duration : undefined,
        error: status === "failed" ? "Connection timeout" : undefined,
      };
    });

    this.saveTaskHistory();
  }

  /**
   * Update scheduled tasks next run times
   */
  protected updateScheduledTasks(): void {
    const now = new Date();

    this.scheduledTasks.forEach((task) => {
      if (task.status === "pending" && task.nextRun <= now) {
        // Task is due, update next run time based on schedule
        task.nextRun = this.calculateNextRun(task.schedule, now);
      }
    });

    this.saveScheduledTasks();
  }

  /**
   * Calculate next run time based on cron expression
   */
  protected calculateNextRun(cronExpression: string, from: Date): Date {
    // Simple cron parser for demo purposes
    const parts = cronExpression.split(" ");
    if (parts.length !== 5) {
      return new Date(from.getTime() + 60 * 60 * 1000); // Default to 1 hour
    }

    const [minute, hour, day, month, dayOfWeek] = parts;
    const next = new Date(from);

    // Simple implementation - just add appropriate intervals
    if (minute.startsWith("*/")) {
      const interval = parseInt(minute.substring(2));
      next.setMinutes(next.getMinutes() + interval);
    } else if (hour.startsWith("*/")) {
      const interval = parseInt(hour.substring(2));
      next.setHours(next.getHours() + interval);
    } else {
      // Default intervals
      if (cronExpression === "0 2 * * *") {
        // Daily at 2 AM
        next.setDate(next.getDate() + 1);
        next.setHours(2, 0, 0, 0);
      } else if (cronExpression === "0 * * * *") {
        // Hourly
        next.setHours(next.getHours() + 1);
        next.setMinutes(0, 0, 0);
      } else if (cronExpression === "*/5 * * * *") {
        // Every 5 minutes
        next.setMinutes(next.getMinutes() + 5);
      } else {
        next.setMinutes(next.getMinutes() + 60); // Default 1 hour
      }
    }

    return next;
  }

  /**
   * Save scheduled tasks to storage
   */
  protected saveScheduledTasks(): void {
    try {
      localStorage.setItem(
        "manifold_scheduled_tasks",
        JSON.stringify(this.scheduledTasks)
      );
    } catch (error) {
      logger.error(
        "Failed to save scheduled tasks",
        "system",
        { error },
        "SystemMonitor"
      );
    }
  }

  /**
   * Save task history to storage
   */
  protected saveTaskHistory(): void {
    try {
      localStorage.setItem(
        "manifold_task_history",
        JSON.stringify(this.taskHistory)
      );
    } catch (error) {
      logger.error(
        "Failed to save task history",
        "system",
        { error },
        "SystemMonitor"
      );
    }
  }

  /**
   * Format bytes to human readable format
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Format duration to human readable format
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }
}
