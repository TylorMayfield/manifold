export interface ImportHistoryItem {
  id: string;
  dataSourceId: string;
  dataSourceName: string;
  dataSourceType: string;
  timestamp: Date;
  recordCount: number;
  previousRecordCount?: number;
  changeType: "new" | "update" | "reimport";
  metadata?: {
    fileSize?: number;
    columns?: number;
    schema?: any;
    diff?: {
      added: number;
      removed: number;
      modified: number;
    };
  };
}

export interface ImportTimelineProps {
  projectId: string;
  refreshTrigger?: number; // Optional trigger to force refresh
}
