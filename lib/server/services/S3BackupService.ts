import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "../utils/logger";
import { Project, DataSource } from "../../../types";

export interface S3Config {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  endpoint?: string; // Custom S3-compatible endpoint URL
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
}

export interface SyncStatus {
  isEnabled: boolean;
  lastSync?: Date;
  nextSync?: Date;
  interval: "hourly" | "daily" | "weekly";
  status: "idle" | "syncing" | "error";
  error?: string;
}

export class S3BackupService {
  private static instance: S3BackupService;
  private s3Client: S3Client | null = null;
  private config: S3Config | null = null;

  static getInstance(): S3BackupService {
    if (!S3BackupService.instance) {
      S3BackupService.instance = new S3BackupService();
    }
    return S3BackupService.instance;
  }

  async configure(config: S3Config): Promise<void> {
    try {
      this.config = config;

      const clientConfig: any = {
        region: config.region,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      };

      // Add custom endpoint if provided
      if (config.endpoint) {
        clientConfig.endpoint = config.endpoint;
        clientConfig.forcePathStyle = true; // Required for most S3-compatible services
      }

      this.s3Client = new S3Client(clientConfig);

      // Test connection
      await this.testConnection();
      logger.success(
        "S3 configuration successful",
        "api",
        {
          region: config.region,
          bucket: config.bucket,
          endpoint: config.endpoint || "AWS S3",
        },
        "S3BackupService"
      );
    } catch (error) {
      logger.error(
        "S3 configuration failed",
        "api",
        { error },
        "S3BackupService"
      );
      throw error;
    }
  }

  async testConnection(): Promise<void> {
    if (!this.s3Client || !this.config) {
      throw new Error("S3 not configured");
    }

    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      MaxKeys: 1,
    });

    await this.s3Client.send(command);
  }

  async backupProject(
    project: Project,
    dataSources: DataSource[],
    description?: string
  ): Promise<BackupMetadata> {
    if (!this.s3Client || !this.config) {
      throw new Error("S3 not configured");
    }

    logger.info(
      "Starting project backup",
      "api",
      { projectId: project.id, projectName: project.name },
      "S3BackupService"
    );

    try {
      const backupId = `backup-${project.id}-${Date.now()}`;

      // Get all snapshots (data) for this project using Mongoose
      const mongoose = await import('mongoose');
      const SnapshotModel = mongoose.default.model('Snapshot');
      const snapshots = await SnapshotModel.find({ projectId: project.id }).lean();

      logger.info(
        "Including snapshots in backup",
        "api",
        {
          projectId: project.id,
          snapshotCount: snapshots.length,
          totalRecords: snapshots.reduce(
            (sum, s) => sum + (s.recordCount || 0),
            0
          ),
        },
        "S3BackupService"
      );

      const backupData = {
        project,
        dataSources,
        snapshots, // Include all snapshot data
        metadata: {
          id: backupId,
          projectId: project.id,
          timestamp: new Date(),
          version: "1.0.0",
          description,
          dataSourceCount: dataSources.length,
          snapshotCount: snapshots.length,
          totalRecords: snapshots.reduce(
            (sum, s) => sum + (s.recordCount || 0),
            0
          ),
        },
      };

      const key = `backups/${project.id}/${backupId}.json`;
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: JSON.stringify(backupData, null, 2),
        ContentType: "application/json",
        Metadata: {
          projectId: project.id,
          backupId,
          timestamp: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      const metadata: BackupMetadata = {
        id: backupId,
        projectId: project.id,
        timestamp: new Date(),
        version: "1.0.0",
        description,
        size: JSON.stringify(backupData).length,
        dataSourceCount: dataSources.length,
        snapshotCount: snapshots.length,
        totalRecords: snapshots.reduce(
          (sum, s) => sum + (s.recordCount || 0),
          0
        ),
      };

      logger.success(
        "Project backup completed",
        "api",
        { backupId, projectId: project.id },
        "S3BackupService"
      );
      return metadata;
    } catch (error) {
      logger.error(
        "Project backup failed",
        "api",
        { error, projectId: project.id },
        "S3BackupService"
      );
      throw error;
    }
  }

  async restoreProject(
    backupId: string,
    projectId: string
  ): Promise<{
    project: Project;
    dataSources: DataSource[];
    snapshots?: any[];
  }> {
    if (!this.s3Client || !this.config) {
      throw new Error("S3 not configured");
    }

    logger.info(
      "Starting project restore",
      "api",
      { backupId, projectId },
      "S3BackupService"
    );

    try {
      const key = `backups/${projectId}/${backupId}.json`;
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const body = await response.Body?.transformToString();

      if (!body) {
        throw new Error("No backup data found");
      }

      const backupData = JSON.parse(body);

      logger.success(
        "Project restore completed",
        "api",
        { backupId, projectId },
        "S3BackupService"
      );
      return {
        project: backupData.project,
        dataSources: backupData.dataSources,
        snapshots: backupData.snapshots || [],
      };
    } catch (error) {
      logger.error(
        "Project restore failed",
        "api",
        { error, backupId, projectId },
        "S3BackupService"
      );
      throw error;
    }
  }

  async listBackups(projectId: string): Promise<BackupMetadata[]> {
    if (!this.s3Client || !this.config) {
      throw new Error("S3 not configured");
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: `backups/${projectId}/`,
      });

      const response = await this.s3Client.send(command);
      const backups: BackupMetadata[] = [];

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.Key.endsWith(".json")) {
            const metadata: BackupMetadata = {
              id: object.Key.split("/").pop()?.replace(".json", "") || "",
              projectId,
              timestamp: object.LastModified || new Date(),
              version: "1.0.0",
              size: object.Size || 0,
              dataSourceCount: 0, // Would need to fetch actual data to get this
            };
            backups.push(metadata);
          }
        }
      }

      return backups.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
    } catch (error) {
      logger.error(
        "Failed to list backups",
        "api",
        { error, projectId },
        "S3BackupService"
      );
      throw error;
    }
  }

  async deleteBackup(backupId: string, projectId: string): Promise<void> {
    if (!this.s3Client || !this.config) {
      throw new Error("S3 not configured");
    }

    logger.info(
      "Deleting backup",
      "api",
      { backupId, projectId },
      "S3BackupService"
    );

    try {
      const key = `backups/${projectId}/${backupId}.json`;
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.success(
        "Backup deleted",
        "api",
        { backupId, projectId },
        "S3BackupService"
      );
    } catch (error) {
      logger.error(
        "Failed to delete backup",
        "api",
        { error, backupId, projectId },
        "S3BackupService"
      );
      throw error;
    }
  }

  async generateDownloadUrl(
    backupId: string,
    projectId: string
  ): Promise<string> {
    if (!this.s3Client || !this.config) {
      throw new Error("S3 not configured");
    }

    try {
      const key = `backups/${projectId}/${backupId}.json`;
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: 3600,
      }); // 1 hour
      return url;
    } catch (error) {
      logger.error(
        "Failed to generate download URL",
        "api",
        { error, backupId, projectId },
        "S3BackupService"
      );
      throw error;
    }
  }

  isConfigured(): boolean {
    return this.s3Client !== null && this.config !== null;
  }

  getConfig(): S3Config | null {
    return this.config;
  }
}

export const s3BackupService = S3BackupService.getInstance();
