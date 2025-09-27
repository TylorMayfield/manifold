export type LogLevel = "debug" | "info" | "warn" | "error" | "success";

export type LogCategory =
  | "system"
  | "database"
  | "file-import"
  | "data-processing"
  | "user-action"
  | "api"
  | "electron"
  | "ui"
  | "backup"
  | "realtime-sync"
  | "data-transformation"
  | "data-quality"
  | "websocket"
  | "job-management";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: any;
  source?: string; // Component or function name
  projectId?: string; // Associated project if applicable
  dataSourceId?: string; // Associated data source if applicable
}

export interface LogFilter {
  levels: LogLevel[];
  categories: LogCategory[];
  searchText?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface LogViewerState {
  entries: LogEntry[];
  filters: LogFilter;
  isAutoScroll: boolean;
  isMinimized: boolean;
  maxEntries: number;
}
