import { EventEmitter } from "events";
import { WebSocketService, DataUpdate, SyncStatus } from "./WebSocketService";
import { logger } from "../utils/logger";

export interface DataSource {
  id: string;
  name: string;
  type: "api" | "database" | "file" | "websocket";
  config: any;
  syncInterval?: number;
  enabled: boolean;
}

export interface SyncConfig {
  sources: DataSource[];
  globalSyncInterval: number;
  conflictResolution: "last_write_wins" | "manual" | "merge";
  maxRetries: number;
}

export class RealTimeSyncManager extends EventEmitter {
  private wsService: WebSocketService;
  private config: SyncConfig;
  private syncStatuses: Map<string, SyncStatus> = new Map();
  private syncTimers: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  constructor(config: SyncConfig) {
    super();
    this.config = config;
    this.wsService = new WebSocketService({
      url: "ws://localhost:8080/ws", // This would be configurable
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
    });

    this.setupWebSocketHandlers();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    try {
      await this.wsService.connect();
      this.isRunning = true;

      // Subscribe to all enabled data sources
      for (const source of this.config.sources) {
        if (source.enabled) {
          this.wsService.subscribe(source.id);
          this.startSourceSync(source);
        }
      }

      logger.info("Real-time sync manager started", "system", {
        sourceCount: this.config.sources.length,
      });

      this.emit("started");
    } catch (error) {
      logger.error("Failed to start real-time sync manager", "system", {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Clear all sync timers
    for (const timer of this.syncTimers.values()) {
      clearInterval(timer);
    }
    this.syncTimers.clear();

    // Unsubscribe from all sources
    for (const source of this.config.sources) {
      this.wsService.unsubscribe(source.id);
    }

    this.wsService.disconnect();

    logger.info("Real-time sync manager stopped", "system");

    this.emit("stopped");
  }

  addDataSource(source: DataSource): void {
    this.config.sources.push(source);

    if (this.isRunning && source.enabled) {
      this.wsService.subscribe(source.id);
      this.startSourceSync(source);
    }

    logger.info("Data source added", "system", {
      sourceId: source.id,
      sourceName: source.name,
    });

    this.emit("sourceAdded", source);
  }

  removeDataSource(sourceId: string): void {
    const index = this.config.sources.findIndex((s) => s.id === sourceId);
    if (index === -1) {
      return;
    }

    const source = this.config.sources[index];
    this.config.sources.splice(index, 1);

    // Stop sync timer
    const timer = this.syncTimers.get(sourceId);
    if (timer) {
      clearInterval(timer);
      this.syncTimers.delete(sourceId);
    }

    // Unsubscribe
    this.wsService.unsubscribe(sourceId);
    this.syncStatuses.delete(sourceId);

    logger.info("Data source removed", "system", {
      sourceId,
    });

    this.emit("sourceRemoved", source);
  }

  updateDataSource(sourceId: string, updates: Partial<DataSource>): void {
    const source = this.config.sources.find((s) => s.id === sourceId);
    if (!source) {
      return;
    }

    Object.assign(source, updates);

    // Restart sync if enabled status changed
    if (updates.enabled !== undefined) {
      const timer = this.syncTimers.get(sourceId);
      if (updates.enabled) {
        this.wsService.subscribe(sourceId);
        this.startSourceSync(source);
      } else {
        if (timer) {
          clearInterval(timer);
          this.syncTimers.delete(sourceId);
        }
        this.wsService.unsubscribe(sourceId);
      }
    }

    logger.info("Data source updated", "system", {
      sourceId,
      updates,
    });

    this.emit("sourceUpdated", source);
  }

  getSyncStatus(sourceId?: string): SyncStatus | Map<string, SyncStatus> {
    if (sourceId) {
      return (
        this.syncStatuses.get(sourceId) || {
          source: sourceId,
          status: "disconnected",
        }
      );
    }
    return new Map(this.syncStatuses);
  }

  forceSync(sourceId: string): void {
    const source = this.config.sources.find((s) => s.id === sourceId);
    if (!source || !source.enabled) {
      return;
    }

    logger.info("Force sync requested", "system", {
      sourceId,
    });

    this.wsService.requestSync(sourceId);
    this.emit("syncRequested", sourceId);
  }

  private setupWebSocketHandlers(): void {
    this.wsService.on("connected", () => {
      logger.info("WebSocket connected for real-time sync", "system");
      this.emit("connected");
    });

    this.wsService.on("disconnected", () => {
      logger.warn("WebSocket disconnected for real-time sync", "system");
      this.emit("disconnected");
    });

    this.wsService.on("dataUpdate", (update: DataUpdate) => {
      this.handleDataUpdate(update);
    });

    this.wsService.on("syncStatus", (status: SyncStatus) => {
      this.handleSyncStatus(status);
    });

    this.wsService.on("error", (error: Error) => {
      logger.error("WebSocket error in real-time sync", "system", {
        error: error.message,
      });
      this.emit("error", error);
    });
  }

  private handleDataUpdate(update: DataUpdate): void {
    logger.info("Data update received", "system", {
      updateId: update.id,
      type: update.type,
      table: update.table,
      source: update.source,
    });

    // Update sync status
    const currentStatus = this.syncStatuses.get(update.source) || {
      source: update.source,
      status: "connected" as const,
    };

    this.syncStatuses.set(update.source, {
      ...currentStatus,
      status: "connected",
      lastSync: update.timestamp,
      recordCount: (currentStatus.recordCount || 0) + 1,
    });

    this.emit("dataUpdate", update);
  }

  private handleSyncStatus(status: SyncStatus): void {
    this.syncStatuses.set(status.source, status);

    logger.info("Sync status updated", "system", {
      source: status.source,
      status: status.status,
      lastSync: status.lastSync,
      error: status.error,
    });

    this.emit("syncStatus", status);
  }

  private startSourceSync(source: DataSource): void {
    if (!this.isRunning || !source.enabled) {
      return;
    }

    const interval = source.syncInterval || this.config.globalSyncInterval;

    const timer = setInterval(() => {
      this.wsService.requestSync(source.id);
    }, interval);

    this.syncTimers.set(source.id, timer);

    logger.info("Started sync for data source", "system", {
      sourceId: source.id,
      interval,
    });
  }
}
