export type BackupProvider = "s3" | "local";

export type BackupFrequency =
  | "disabled"
  | "every_15_minutes"
  | "hourly"
  | "every_6_hours"
  | "daily"
  | "weekly"
  | "monthly";

export interface BackupConfig {
  provider: BackupProvider;
  frequency: BackupFrequency;
  enabled: boolean;
  maxBackups: number; // Maximum number of backups to keep
  s3Config?: S3Config;
  localConfig?: LocalBackupConfig;
  lastBackup?: Date;
  nextBackup?: Date;
}

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string;
}

export interface LocalBackupConfig {
  directory: string; // Local directory to store backups
  fileNamePrefix?: string; // Optional prefix for backup files
}

export interface BackupMetadata {
  id: string;
  projectId: string;
  timestamp: Date;
  version: string;
  description?: string;
  size: number;
  dataSourceCount: number;
  snapshotCount?: number;
  totalRecords?: number;
  provider: BackupProvider;
  location: string; // S3 key or local file path
}

export interface BackupSchedule {
  id: string;
  projectId: string;
  config: BackupConfig;
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  error?: string;
}

export const BACKUP_FREQUENCY_OPTIONS = [
  { value: "disabled", label: "Disabled", description: "No automatic backups" },
  {
    value: "every_15_minutes",
    label: "Every 15 minutes",
    description: "Very frequent backups",
  },
  { value: "hourly", label: "Hourly", description: "Backup every hour" },
  {
    value: "every_6_hours",
    label: "Every 6 hours",
    description: "Backup every 6 hours",
  },
  { value: "daily", label: "Daily", description: "Backup once per day" },
  { value: "weekly", label: "Weekly", description: "Backup once per week" },
  { value: "monthly", label: "Monthly", description: "Backup once per month" },
] as const;

export const BACKUP_FREQUENCY_INTERVALS: Record<BackupFrequency, number> = {
  disabled: 0,
  every_15_minutes: 15 * 60 * 1000, // 15 minutes in milliseconds
  hourly: 60 * 60 * 1000, // 1 hour in milliseconds
  every_6_hours: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
  daily: 24 * 60 * 60 * 1000, // 1 day in milliseconds
  weekly: 7 * 24 * 60 * 60 * 1000, // 1 week in milliseconds
  monthly: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
};
