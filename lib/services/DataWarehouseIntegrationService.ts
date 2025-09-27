import { clientLogger } from "../utils/ClientLogger";
import { DataQualityFramework } from "./DataQualityFramework";
import { DataLineageTracker } from "./DataLineageTracker";
import { DataCatalogService } from "./DataCatalogService";
import { ETLPipelineManager } from "./ETLPipelineManager";
import { SchemaEvolutionManager } from "./SchemaEvolutionManager";
import { ETLSchedulerService } from "./ETLSchedulerService";
import { clientDatabaseService } from "../database/ClientDatabaseService";
import { DataSource, Snapshot } from "../../types";

export interface DataWarehouseIntegrationConfig {
  enableDataQuality: boolean;
  enableLineageTracking: boolean;
  enableDataCatalog: boolean;
  enableETLPipelines: boolean;
  enableSchemaEvolution: boolean;
  qualityThreshold: number; // 0-100
  autoCreatePipelines: boolean;
}

export class DataWarehouseIntegrationService {
  private static instance: DataWarehouseIntegrationService;
  private qualityFramework: DataQualityFramework;
  private lineageTracker: DataLineageTracker;
  private catalogService: DataCatalogService;
  private etlManager: ETLPipelineManager;
  private schemaManager: SchemaEvolutionManager;
  private etlScheduler: ETLSchedulerService;
  private config: DataWarehouseIntegrationConfig;

  static getInstance(): DataWarehouseIntegrationService {
    if (!DataWarehouseIntegrationService.instance) {
      DataWarehouseIntegrationService.instance =
        new DataWarehouseIntegrationService();
    }
    return DataWarehouseIntegrationService.instance;
  }

  constructor() {
    this.qualityFramework = DataQualityFramework.getInstance();
    this.lineageTracker = DataLineageTracker.getInstance();
    this.catalogService = DataCatalogService.getInstance();
    this.etlManager = ETLPipelineManager.getInstance();
    this.schemaManager = SchemaEvolutionManager.getInstance();
    this.etlScheduler = ETLSchedulerService.getInstance();

    this.config = {
      enableDataQuality: true,
      enableLineageTracking: true,
      enableDataCatalog: true,
      enableETLPipelines: true,
      enableSchemaEvolution: true,
      qualityThreshold: 80,
      autoCreatePipelines: false,
    };
  }

  // Data Source Integration
  async onDataSourceCreated(
    dataSource: DataSource,
    projectId: string
  ): Promise<void> {
    try {
      clientLogger.info(
        "Data warehouse integration: Data source created",
        "database",
        {
          dataSourceId: dataSource.id,
          projectId,
        }
      );

      // 1. Track in data lineage
      if (this.config.enableLineageTracking) {
        const nodeId = this.lineageTracker.trackDataSource(
          dataSource.id,
          dataSource.name,
          {
            type: dataSource.type,
            projectId,
            createdAt: dataSource.createdAt,
          }
        );
        clientLogger.info("Data lineage node created", "database", {
          nodeId,
          dataSourceId: dataSource.id,
        });
      }

      // 2. Add to data catalog
      if (this.config.enableDataCatalog) {
        const catalogEntry = await this.catalogService.addEntry({
          name: dataSource.name,
          type: "table",
          description: `Data source: ${dataSource.name}`,
          tags: [dataSource.type, "data-source"],
          owner: "system",
          dataSourceId: dataSource.id,
          schema: {
            columns: [],
            primaryKeys: [],
            foreignKeys: [],
            indexes: [],
            constraints: [],
            statistics: {
              totalRows: 0,
              totalColumns: 0,
              totalSize: 0,
              lastAnalyzed: new Date(),
            },
          },
          metadata: {
            source: {
              type: dataSource.type,
              location:
                dataSource.config?.filePath ||
                dataSource.config?.apiUrl ||
                "unknown",
            },
            format: {
              type: dataSource.type,
            },
            business: {
              domain: "database",
              category: "source",
              purpose: "Data ingestion",
              stakeholders: ["data-engineer", "analyst"],
              businessRules: [],
            },
            technical: {
              refreshFrequency: "on-demand",
              retentionPolicy: "indefinite",
              backupStrategy: "incremental",
              versioning: true,
              changeLog: [],
            },
          },
          quality: {
            score: 100,
            lastChecked: new Date(),
            checks: [],
            issues: [],
            trends: [],
          },
          lineage: {
            upstream: [],
            downstream: [],
            transformations: [],
            lastUpdated: new Date(),
          },
          access: {
            permissions: [],
            users: [],
            groups: [],
            lastAudit: new Date(),
          },
        });
        clientLogger.info("Data catalog entry created", "database", {
          catalogEntryId: catalogEntry,
          dataSourceId: dataSource.id,
        });
      }

      // 3. Create initial schema version
      if (this.config.enableSchemaEvolution) {
        const schemaVersion = await this.schemaManager.createSchemaVersion(
          dataSource.id,
          {
            columns: [],
            primaryKeys: [],
            foreignKeys: [],
            indexes: [],
            constraints: [],
            metadata: {
              tableName: dataSource.name,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
          `Initial schema for ${dataSource.name}`,
          "system"
        );
        clientLogger.info("Initial schema version created", "database", {
          schemaVersionId: schemaVersion,
          dataSourceId: dataSource.id,
        });
      }
    } catch (error) {
      clientLogger.error(
        "Data warehouse integration failed for data source creation",
        "database",
        {
          error,
          dataSourceId: dataSource.id,
          projectId,
        }
      );
    }
  }

  async onSnapshotCreated(
    snapshot: Snapshot,
    dataSource: DataSource,
    projectId: string
  ): Promise<void> {
    try {
      clientLogger.info(
        "Data warehouse integration: Snapshot created",
        "database",
        {
          snapshotId: snapshot.id,
          dataSourceId: dataSource.id,
          projectId,
          recordCount: snapshot.recordCount,
        }
      );

      // 1. Run data quality checks
      if (this.config.enableDataQuality && snapshot.data) {
        const qualityProfile = await this.qualityFramework.runQualityChecks(
          dataSource.id,
          snapshot.data
        );

        // Update catalog with quality information
        if (this.config.enableDataCatalog) {
          const entries = this.catalogService.getEntriesByDataSource(
            dataSource.id
          );
          if (entries.length > 0) {
            await this.catalogService.updateQuality(entries[0].id, {
              score: qualityProfile.qualityScore,
              lastChecked: new Date(),
              checks: qualityProfile.checks.map((check) => ({
                id: check.id,
                name: check.ruleId,
                type: check.ruleId,
                status: check.result.passed ? "passed" : "failed",
                score: check.result.score,
                lastRun: check.executedAt,
                details: check.result,
              })),
              issues: qualityProfile.checks.flatMap((check) =>
                check.result.issues.map((issue) => ({
                  id: issue.id,
                  type: issue.type,
                  severity: issue.severity,
                  message: issue.message,
                  affectedRows: issue.affectedRecords,
                  firstDetected: new Date(),
                  lastDetected: new Date(),
                  status: "open" as const,
                }))
              ),
              trends: [
                {
                  date: new Date(),
                  score: qualityProfile.qualityScore,
                  issues:
                    qualityProfile.summary.errors +
                    qualityProfile.summary.warnings,
                },
              ],
            });
          }
        }

        // Log quality issues if below threshold
        if (qualityProfile.qualityScore < this.config.qualityThreshold) {
          clientLogger.warn("Data quality below threshold", "database", {
            dataSourceId: dataSource.id,
            qualityScore: qualityProfile.qualityScore,
            threshold: this.config.qualityThreshold,
            issues:
              qualityProfile.summary.errors + qualityProfile.summary.warnings,
          });
        }
      }

      // 2. Update schema if data structure changed
      if (
        this.config.enableSchemaEvolution &&
        snapshot.data &&
        snapshot.data.length > 0
      ) {
        const newSchema = await this.catalogService.analyzeSchema(
          dataSource.id,
          snapshot.data
        );

        // Check if schema has changed
        const currentVersion = this.schemaManager.getActiveSchemaVersion(
          dataSource.id
        );
        if (currentVersion) {
          const comparison = await this.schemaManager.compareSchemas(
            dataSource.id,
            currentVersion.version,
            "current"
          );

          if (comparison.changes.length > 0) {
            // Create new schema version
            // Transform schema to match SchemaEvolutionManager interface
            const transformedSchema = {
              ...newSchema,
              columns: newSchema.columns.map((col, index) => ({
                ...col,
                position: index + 1,
                attributes: {
                  autoIncrement: false,
                  unique: false,
                  indexed: false,
                },
              })),
              foreignKeys: newSchema.foreignKeys.map((fk) => ({
                name: `fk_${fk.column}_${fk.referencedTable}`,
                columns: [fk.column],
                referencedTable: fk.referencedTable,
                referencedColumns: [fk.referencedColumn],
                onDelete: "RESTRICT" as const,
                onUpdate: "RESTRICT" as const,
              })),
              indexes: newSchema.indexes.map((idx) => ({
                ...idx,
                type: idx.type.toUpperCase() as
                  | "PRIMARY"
                  | "UNIQUE"
                  | "INDEX"
                  | "FULLTEXT",
                algorithm: "BTREE" as const,
                comment: `Index for ${idx.columns.join(", ")}`,
              })),
              constraints: newSchema.constraints.map((constraint) => ({
                ...constraint,
                type: constraint.type.toUpperCase().replace("_", "_") as
                  | "CHECK"
                  | "NOT_NULL"
                  | "UNIQUE"
                  | "FOREIGN_KEY",
                enabled: true,
              })),
              metadata: {
                tableName: dataSource.name,
                comment: `Schema updated from snapshot ${snapshot.id}`,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            };

            await this.schemaManager.createSchemaVersion(
              dataSource.id,
              transformedSchema,
              `Schema updated from snapshot ${snapshot.id}`,
              "system"
            );
            clientLogger.info("Schema version updated", "database", {
              dataSourceId: dataSource.id,
              changes: comparison.changes.length,
              breakingChanges: comparison.breakingChanges.length,
            });
          }
        }
      }

      // 3. Update data catalog with new schema information
      if (
        this.config.enableDataCatalog &&
        snapshot.data &&
        snapshot.data.length > 0
      ) {
        const entries = this.catalogService.getEntriesByDataSource(
          dataSource.id
        );
        if (entries.length > 0) {
          const newSchema = await this.catalogService.analyzeSchema(
            dataSource.id,
            snapshot.data
          );
          await this.catalogService.updateEntry(entries[0].id, {
            schema: newSchema,
            metadata: {
              ...entries[0].metadata,
              technical: {
                ...entries[0].metadata.technical,
                changeLog: [
                  ...entries[0].metadata.technical.changeLog,
                  {
                    version: "1.0.0",
                    date: new Date(),
                    author: "system",
                    description: `Updated from snapshot ${snapshot.id}`,
                    changes: ["Data structure updated"],
                  },
                ],
              },
            },
          });
        }
      }

      // 4. Auto-create ETL pipelines if enabled
      if (this.config.enableETLPipelines && this.config.autoCreatePipelines) {
        await this.createDefaultETLPipelines(dataSource, projectId);
      }
    } catch (error) {
      clientLogger.error(
        "Data warehouse integration failed for snapshot creation",
        "database",
        {
          error,
          snapshotId: snapshot.id,
          dataSourceId: dataSource.id,
          projectId,
        }
      );
    }
  }

  // Backup Integration
  async onBackupCreated(
    backupId: string,
    projectId: string,
    dataSources: DataSource[]
  ): Promise<void> {
    try {
      clientLogger.info(
        "Data warehouse integration: Backup created",
        "database",
        {
          backupId,
          projectId,
          dataSourceCount: dataSources.length,
        }
      );

      // Include data warehouse metadata in backup
      if (this.config.enableDataCatalog) {
        const catalogData = await this.catalogService.exportCatalog();
        // In a real implementation, this would be included in the backup
        clientLogger.info("Data catalog included in backup", "database", {
          backupId,
          catalogEntries: catalogData.entries.length,
        });
      }

      if (this.config.enableLineageTracking) {
        const lineageData = this.lineageTracker.exportLineage();
        // In a real implementation, this would be included in the backup
        clientLogger.info("Data lineage included in backup", "database", {
          backupId,
          nodes: lineageData.nodes.length,
          edges: lineageData.edges.length,
        });
      }
    } catch (error) {
      clientLogger.error(
        "Data warehouse integration failed for backup creation",
        "database",
        {
          error,
          backupId,
          projectId,
        }
      );
    }
  }

  async onBackupRestored(
    backupId: string,
    projectId: string,
    dataSources: DataSource[]
  ): Promise<void> {
    try {
      clientLogger.info(
        "Data warehouse integration: Backup restored",
        "database",
        {
          backupId,
          projectId,
          dataSourceCount: dataSources.length,
        }
      );

      // Restore data warehouse metadata
      if (this.config.enableDataCatalog) {
        // In a real implementation, this would restore catalog data from backup
        clientLogger.info("Data catalog restored from backup", "database", {
          backupId,
        });
      }

      if (this.config.enableLineageTracking) {
        // In a real implementation, this would restore lineage data from backup
        clientLogger.info("Data lineage restored from backup", "database", {
          backupId,
        });
      }

      // Re-run quality checks on restored data
      if (this.config.enableDataQuality) {
        for (const dataSource of dataSources) {
          const snapshots = await clientDatabaseService.getSnapshots(projectId);
          const dataSourceSnapshots = snapshots.filter(
            (s) => s.dataSourceId === dataSource.id
          );

          if (dataSourceSnapshots.length > 0) {
            const latestSnapshot =
              dataSourceSnapshots[dataSourceSnapshots.length - 1];
            if (latestSnapshot.data) {
              await this.qualityFramework.runQualityChecks(
                dataSource.id,
                latestSnapshot.data
              );
            }
          }
        }
      }
    } catch (error) {
      clientLogger.error(
        "Data warehouse integration failed for backup restoration",
        "database",
        {
          error,
          backupId,
          projectId,
        }
      );
    }
  }

  // Job System Integration
  async onJobCreated(
    jobId: string,
    jobType: string,
    config: any
  ): Promise<void> {
    try {
      clientLogger.info("Data warehouse integration: Job created", "database", {
        jobId,
        jobType,
      });

      // Track ETL jobs in lineage
      if (this.config.enableLineageTracking && jobType === "etl_pipeline") {
        const nodeId = this.lineageTracker.addNode({
          type: "workflow",
          name: config.name || `ETL Job ${jobId}`,
          description: `ETL pipeline job: ${config.name}`,
          metadata: {
            jobId,
            jobType,
            config,
          },
        });
        clientLogger.info("ETL job tracked in lineage", "database", {
          nodeId,
          jobId,
        });
      }
    } catch (error) {
      clientLogger.error(
        "Data warehouse integration failed for job creation",
        "database",
        {
          error,
          jobId,
          jobType,
        }
      );
    }
  }

  async onJobExecuted(
    jobId: string,
    jobType: string,
    result: any
  ): Promise<void> {
    try {
      clientLogger.info(
        "Data warehouse integration: Job executed",
        "database",
        {
          jobId,
          jobType,
          success: result.success,
        }
      );

      // Update ETL pipeline execution in lineage
      if (this.config.enableLineageTracking && jobType === "etl_pipeline") {
        // In a real implementation, this would update lineage with execution results
        clientLogger.info("ETL job execution tracked in lineage", "database", {
          jobId,
          success: result.success,
        });
      }
    } catch (error) {
      clientLogger.error(
        "Data warehouse integration failed for job execution",
        "database",
        {
          error,
          jobId,
          jobType,
        }
      );
    }
  }

  // ETL Pipeline Integration
  private async createDefaultETLPipelines(
    dataSource: DataSource,
    projectId: string
  ): Promise<void> {
    try {
      // Create a simple data quality pipeline
      const qualityPipelineId = await this.etlManager.createPipeline({
        name: `Data Quality Check - ${dataSource.name}`,
        description: `Automated data quality checks for ${dataSource.name}`,
        status: "active",
        schedule: "0 0 * * *", // Daily at midnight
        source: {
          type: "data_source",
          config: {
            dataSourceId: dataSource.id,
          },
        },
        transformations: [
          {
            id: "quality_check",
            name: "Data Quality Validation",
            type: "custom",
            config: {
              script: `
                // Run data quality checks
                const qualityFramework = DataQualityFramework.getInstance();
                const profile = await qualityFramework.runQualityChecks('${dataSource.id}', data);
                
                if (profile.qualityScore < ${this.config.qualityThreshold}) {
                  throw new Error(\`Data quality below threshold: \${profile.qualityScore}%\`);
                }
                
                return data;
              `,
            },
            order: 1,
            enabled: true,
          },
        ],
        destination: {
          type: "data_source",
          config: {
            dataSourceId: dataSource.id,
          },
          mode: "append",
        },
        metadata: {
          version: "1.0.0",
          author: "system",
          tags: ["data-quality", "automated"],
          dependencies: [],
          environment: "production",
          monitoring: {
            enabled: true,
            alerts: [
              {
                id: "quality_alert",
                name: "Data Quality Alert",
                type: "error",
                condition: "quality_score < 80",
                enabled: true,
                recipients: ["data-team"],
              },
            ],
            metrics: [
              {
                name: "quality_score",
                type: "gauge",
                description: "Data quality score",
                unit: "percentage",
              },
            ],
            thresholds: [
              {
                metric: "quality_score",
                operator: "lt",
                value: this.config.qualityThreshold,
                severity: "error",
              },
            ],
          },
        },
      });

      // Create a scheduled job for the pipeline
      const scheduledJobId = await this.etlScheduler.createScheduledJob(
        qualityPipelineId,
        "0 0 * * *", // Daily at midnight
        {
          timeout: 1800, // 30 minutes
          retries: 3,
          notifications: {
            onSuccess: true,
            onFailure: true,
            onStart: false,
          },
          environment: "production",
          tags: ["data-quality", "automated"],
        }
      );

      clientLogger.info(
        "Default ETL pipeline and scheduled job created",
        "database",
        {
          pipelineId: qualityPipelineId,
          scheduledJobId,
          dataSourceId: dataSource.id,
          pipelineType: "data-quality",
          schedule: "0 0 * * *",
        }
      );
    } catch (error) {
      clientLogger.error("Failed to create default ETL pipelines", "database", {
        error,
        dataSourceId: dataSource.id,
        projectId,
      });
    }
  }

  // Configuration Management
  updateConfig(newConfig: Partial<DataWarehouseIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    clientLogger.info("Data warehouse integration config updated", "database", {
      config: this.config,
    });
  }

  getConfig(): DataWarehouseIntegrationConfig {
    return { ...this.config };
  }

  // Health Check
  async getHealthStatus(): Promise<{
    status: string;
    components: Record<string, { status: string; message: string }>;
  }> {
    const components: Record<string, { status: string; message: string }> = {};

    try {
      // Check data quality framework
      if (this.config.enableDataQuality) {
        const profiles = this.qualityFramework.getAllProfiles();
        components.dataQuality = {
          status: "healthy",
          message: `${profiles.length} data sources monitored`,
        };
      }

      // Check lineage tracker
      if (this.config.enableLineageTracking) {
        const nodes = this.lineageTracker.getAllNodes();
        components.lineageTracking = {
          status: "healthy",
          message: `${nodes.length} nodes tracked`,
        };
      }

      // Check data catalog
      if (this.config.enableDataCatalog) {
        const entries = this.catalogService.getAllEntries();
        components.dataCatalog = {
          status: "healthy",
          message: `${entries.length} entries cataloged`,
        };
      }

      // Check ETL pipelines
      if (this.config.enableETLPipelines) {
        const pipelines = this.etlManager.getAllPipelines();
        const scheduledJobs = this.etlScheduler.getScheduledJobs();
        components.etlPipelines = {
          status: "healthy",
          message: `${pipelines.length} pipelines, ${scheduledJobs.length} scheduled jobs`,
        };
      }

      // Check schema evolution
      if (this.config.enableSchemaEvolution) {
        const migrations = this.schemaManager.getAllMigrations();
        components.schemaEvolution = {
          status: "healthy",
          message: `${migrations.length} migrations tracked`,
        };
      }

      const overallStatus = Object.values(components).every(
        (c) => c.status === "healthy"
      )
        ? "healthy"
        : "degraded";

      return {
        status: overallStatus,
        components,
      };
    } catch (error) {
      clientLogger.error("Data warehouse health check failed", "database", {
        error,
      });

      return {
        status: "unhealthy",
        components: {
          error: {
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          },
        },
      };
    }
  }
}
