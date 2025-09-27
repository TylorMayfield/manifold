import { EventEmitter } from "events";
import { logger } from "../utils/logger";

export interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export interface DataUpdate {
  id: string;
  type: "insert" | "update" | "delete" | "sync";
  table: string;
  data?: any;
  timestamp: number;
  source: string;
}

export interface SyncStatus {
  source: string;
  status: "connected" | "disconnected" | "syncing" | "error";
  lastSync?: number;
  error?: string;
  recordCount?: number;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isManualDisconnect = false;

  constructor(config: WebSocketConfig) {
    super();
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected()) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.isManualDisconnect = false;

      try {
        logger.info("WebSocket connecting", "system", {
          url: this.config.url,
        });

        this.ws = new WebSocket(this.config.url, this.config.protocols);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();

          logger.info("WebSocket connected", "system", {
            url: this.config.url,
          });

          this.emit("connected");
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            logger.error("WebSocket message parse error", "system", {
              error: (error as Error).message,
              data: event.data,
            });
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.stopHeartbeat();

          logger.warn("WebSocket disconnected", "system", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          this.emit("disconnected", { code: event.code, reason: event.reason });

          if (!this.isManualDisconnect) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          this.isConnecting = false;

          logger.error("WebSocket error", "system", {
            error: "WebSocket connection error",
          });

          this.emit("error", new Error("WebSocket connection error"));
          reject(error);
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, "Manual disconnect");
      this.ws = null;
    }
  }

  send(message: any): void {
    if (!this.isConnected()) {
      logger.warn("WebSocket not connected, cannot send message", "system", {
        message,
      });
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      logger.error("WebSocket send error", "system", {
        error: (error as Error).message,
        message,
      });
    }
  }

  private isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case "data_update":
        this.emit("dataUpdate", message.data as DataUpdate);
        break;
      case "sync_status":
        this.emit("syncStatus", message.data as SyncStatus);
        break;
      case "heartbeat":
        // Respond to heartbeat
        this.send({ type: "heartbeat_ack" });
        break;
      case "error":
        logger.error("WebSocket server error", "system", {
          error: message.error,
        });
        this.emit("error", new Error(message.error));
        break;
      default:
        this.emit("message", message);
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      logger.error("WebSocket max reconnection attempts reached", "system", {
        attempts: this.reconnectAttempts,
      });
      this.emit("maxReconnectAttemptsReached");
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);

    logger.info("WebSocket scheduling reconnect", "system", {
      attempt: this.reconnectAttempts,
      delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        logger.error("WebSocket reconnection failed", "system", {
          error: (error as Error).message,
        });
      });
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: "heartbeat" });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Subscribe to specific data sources
  subscribe(sourceId: string): void {
    this.send({
      type: "subscribe",
      sourceId,
    });
  }

  // Unsubscribe from data sources
  unsubscribe(sourceId: string): void {
    this.send({
      type: "unsubscribe",
      sourceId,
    });
  }

  // Request initial sync for a data source
  requestSync(sourceId: string): void {
    this.send({
      type: "sync_request",
      sourceId,
    });
  }
}
