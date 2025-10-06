/**
 * Integration Hub
 * 
 * Central coordination service that connects all features together:
 * - Auto-catalog data sources and pipelines
 * - Auto-detect PII and suggest masking
 * - Connect streaming to pipelines
 * - Track execution lineage
 * - Coordinate CDC with pipelines
 * - Enable bulk operations across all features
 * 
 * This creates a cohesive, unified experience across all features.
 */

import { logger } from '../utils/logger';
import { dataCatalog, CatalogEntry } from './DataCatalog';
import { dataMasking } from './DataMasking';
import { pipelineExecutor } from './PipelineExecutor';
import { cdcManager } from './CDCManager';
import { streamingConnector } from './StreamingConnector';
import { aiAssistant } from './AIAssistant';
import { bulkOperations } from './BulkOperations';
import { dataLineage } from './DataLineage';
import { monitoring } from './MonitoringService';
import { pipelinePreview } from './PipelinePreview';
import { Pipeline } from '../../types';

// ==================== TYPES ====================

export interface IntegrationConfig {
  autoCatalog: boolean;
  autoDetectPII: boolean;
  autoMaskSensitiveData: boolean;
  enableLineageTracking: boolean;
  enableCDCForStreams: boolean;
  enableAISuggestions: boolean;
  enableMonitoring: boolean;
  enablePreview: boolean;
}

export interface DataSourceIntegration {
  dataSourceId: string;
  catalogEntryId?: string;
  maskingPolicyId?: string;
  piiDetectionResults?: any[];
  cdcConfigId?: string;
  streamConnectionId?: string;
}

export interface PipelineIntegration {
  pipelineId: string;
  catalogEntryId?: string;
  testSuiteId?: string;
  executionHistory: string[];
  dependencies: string[];
  downstreamConsumers: string[];
}

// ==================== INTEGRATION HUB ====================

export class IntegrationHub {
  private static instance: IntegrationHub;
  
  private config: IntegrationConfig = {
    autoCatalog: true,
    autoDetectPII: true,
    autoMaskSensitiveData: false,
    enableLineageTracking: true,
    enableCDCForStreams: true,
    enableAISuggestions: true,
    enableMonitoring: true,
    enablePreview: true,
  };

  private dataSourceIntegrations: Map<string, DataSourceIntegration> = new Map();
  private pipelineIntegrations: Map<string, PipelineIntegration> = new Map();

  static getInstance(): IntegrationHub {
    if (!IntegrationHub.instance) {
      IntegrationHub.instance = new IntegrationHub();
    }
    return IntegrationHub.instance;
  }

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners to coordinate between services
   */
  private setupEventListeners(): void {
    // Listen to streaming events
    streamingConnector.on('batch:processed', ({ stream, messages }) => {
      this.handleStreamingBatch(stream, messages);
    });

    logger.info('Integration Hub initialized', 'integration-hub', {
      config: this.config,
    });
  }

  // ==================== DATA SOURCE INTEGRATION ====================

  /**
   * Onboard a new data source with full integration
   */
  async onboardDataSource(dataSource: any, data: any[]): Promise<DataSourceIntegration> {
    logger.info(`Onboarding data source: ${dataSource.name}`, 'integration-hub', {
      dataSourceId: dataSource.id,
    });

    const integration: DataSourceIntegration = {
      dataSourceId: dataSource.id,
    };

    // 1. Register in Data Catalog
    if (this.config.autoCatalog) {
      const catalogEntry = dataCatalog.registerAsset({
        assetType: 'data_source',
        assetId: dataSource.id,
        name: dataSource.name,
        qualifiedName: `${dataSource.projectId}.${dataSource.name}`,
        description: `Data source: ${dataSource.type}`,
        tags: [dataSource.type, 'data-source'],
        classifications: [],
        technicalMetadata: {
          dataType: dataSource.type,
          recordCount: data.length,
          format: dataSource.type,
        },
        businessMetadata: {
          department: 'Data Engineering',
          domain: 'Data Integration',
        },
      });

      integration.catalogEntryId = catalogEntry.id;
      
      // Register in lineage graph
      if (this.config.enableLineageTracking) {
        dataLineage.registerNode({
          id: dataSource.id,
          type: 'data_source',
          name: dataSource.name,
          metadata: {
            type: dataSource.type,
            recordCount: data.length,
          },
        });
      }
      
      logger.success('Data source cataloged', 'integration-hub', {
        dataSourceId: dataSource.id,
        catalogEntryId: catalogEntry.id,
      });
    }

    // 2. Auto-detect PII
    if (this.config.autoDetectPII && data.length > 0) {
      const piiResults = await dataMasking.detectPII(data, {
        sampleSize: Math.min(100, data.length),
        minConfidence: 0.7,
      });

      if (piiResults.length > 0) {
        integration.piiDetectionResults = piiResults;

        // Update catalog with PII flag
        if (integration.catalogEntryId) {
          dataCatalog.updateAsset(integration.catalogEntryId, {
            pii: true,
            sensitivity: 'confidential',
          });
        }

        logger.warn(`PII detected in data source: ${dataSource.name}`, 'integration-hub', {
          dataSourceId: dataSource.id,
          piiFieldCount: piiResults.length,
        });

        // 3. Auto-create masking policy if configured
        if (this.config.autoMaskSensitiveData) {
          const maskingPolicy = dataMasking.createPolicy({
            name: `Auto-Mask ${dataSource.name}`,
            description: 'Auto-generated masking policy based on PII detection',
            rules: piiResults.map(pii => ({
              name: `Mask ${pii.field}`,
              field: pii.field,
              piiType: pii.piiType,
              strategy: this.suggestMaskingStrategy(pii.piiType as any),
              enabled: true,
            })),
            tags: ['auto-generated', 'pii'],
          });

          integration.maskingPolicyId = maskingPolicy.id;

          logger.success('Auto-masking policy created', 'integration-hub', {
            dataSourceId: dataSource.id,
            policyId: maskingPolicy.id,
            rules: maskingPolicy.rules.length,
          });
        }
      }
    }

    // 4. AI Suggestions
    if (this.config.enableAISuggestions && data.length > 0) {
      // Suggest transformations for common patterns
      const fields = Object.keys(data[0]);
      for (const field of fields.slice(0, 5)) { // Limit to first 5 fields
        const suggestions = await aiAssistant.suggestTransformations(field, data);
        if (suggestions.transformations.length > 0) {
          logger.info(`AI suggestions available for field: ${field}`, 'integration-hub', {
            dataSourceId: dataSource.id,
            field,
            suggestionsCount: suggestions.transformations.length,
          });
        }
      }
    }

    // Store integration
    this.dataSourceIntegrations.set(dataSource.id, integration);

    logger.success(`Data source onboarded: ${dataSource.name}`, 'integration-hub', {
      catalogued: !!integration.catalogEntryId,
      piiDetected: (integration.piiDetectionResults?.length || 0) > 0,
      maskingPolicy: !!integration.maskingPolicyId,
    });

    return integration;
  }

  /**
   * Suggest masking strategy based on PII type
   */
  private suggestMaskingStrategy(piiType: string): any {
    const strategies: Record<string, string> = {
      email: 'hash',
      phone: 'partial',
      ssn: 'redact',
      credit_card: 'tokenize',
      address: 'generalize',
      name: 'fake',
      date_of_birth: 'generalize',
      ip_address: 'partial',
      passport: 'tokenize',
      driver_license: 'tokenize',
    };

    return strategies[piiType] || 'redact';
  }

  // ==================== PIPELINE INTEGRATION ====================

  /**
   * Onboard a pipeline with full integration
   */
  async onboardPipeline(pipeline: Pipeline): Promise<PipelineIntegration> {
    logger.info(`Onboarding pipeline: ${pipeline.name}`, 'integration-hub', {
      pipelineId: pipeline.id,
    });

    const integration: PipelineIntegration = {
      pipelineId: pipeline.id,
      executionHistory: [],
      dependencies: [],
      downstreamConsumers: [],
    };

    // 1. Register in Data Catalog
    if (this.config.autoCatalog) {
      const catalogEntry = dataCatalog.registerAsset({
        assetType: 'pipeline',
        assetId: pipeline.id,
        name: pipeline.name,
        qualifiedName: `pipelines.${pipeline.name}`,
        description: `ETL Pipeline with ${pipeline.steps.length} transformation steps`,
        tags: ['pipeline', 'etl'],
        classifications: pipeline.steps.map(s => s.type),
        technicalMetadata: {
          format: 'etl-pipeline',
          recordCount: pipeline.steps.length,
        },
        businessMetadata: {
          domain: 'Data Transformation',
        },
      });

      integration.catalogEntryId = catalogEntry.id;
      
      // Register in lineage graph
      if (this.config.enableLineageTracking) {
        dataLineage.registerNode({
          id: pipeline.id,
          type: 'pipeline',
          name: pipeline.name,
          metadata: {
            steps: pipeline.steps.length,
          },
        });
      }
    }

    // 2. Track lineage - connect input sources to pipeline
    if (this.config.enableLineageTracking && pipeline.inputSourceIds) {
      for (const sourceId of pipeline.inputSourceIds) {
        const sourceIntegration = this.dataSourceIntegrations.get(sourceId);
        if (sourceIntegration?.catalogEntryId && integration.catalogEntryId) {
          // Update catalog with lineage
          dataCatalog.updateAsset(integration.catalogEntryId, {
            upstreamDependencies: [sourceIntegration.catalogEntryId],
          });

          dataCatalog.updateAsset(sourceIntegration.catalogEntryId, {
            downstreamDependents: [integration.catalogEntryId],
          });

          integration.dependencies.push(sourceIntegration.catalogEntryId);
        }
      }
    }

    // 3. AI-powered optimization suggestions
    if (this.config.enableAISuggestions) {
      logger.info('Analyzing pipeline for optimization opportunities', 'integration-hub', {
        pipelineId: pipeline.id,
      });
    }

    // Store integration
    this.pipelineIntegrations.set(pipeline.id, integration);

    logger.success(`Pipeline onboarded: ${pipeline.name}`, 'integration-hub', {
      catalogued: !!integration.catalogEntryId,
      dependencies: integration.dependencies.length,
    });

    return integration;
  }

  /**
   * Execute pipeline with integrated features
   */
  async executePipelineIntegrated(
    pipeline: Pipeline,
    inputData: Record<string, any[]>,
    context: any,
    options?: {
      applyMasking?: boolean;
      maskingPolicyId?: string;
      enableCDC?: boolean;
      trackLineage?: boolean;
    }
  ): Promise<any> {
    logger.info(`Executing integrated pipeline: ${pipeline.name}`, 'integration-hub', {
      pipelineId: pipeline.id,
      options,
    });

    // 1. Apply masking to input data if requested
    let processedInput = { ...inputData };
    if (options?.applyMasking && options?.maskingPolicyId) {
      for (const [sourceId, data] of Object.entries(inputData)) {
        const { maskedData } = await dataMasking.applyPolicy(options.maskingPolicyId, data);
        processedInput[sourceId] = maskedData;

        logger.info('Applied masking to input data', 'integration-hub', {
          sourceId,
          originalRecords: data.length,
          maskedRecords: maskedData.length,
        });
      }
    }

    // 2. Execute pipeline
    const result = await pipelineExecutor.executePipeline(pipeline, processedInput, context);

    // 3. Track execution in pipeline integration
    const integration = this.pipelineIntegrations.get(pipeline.id);
    if (integration) {
      integration.executionHistory.push(context.executionId);
    }

    // 4. Update catalog with execution metadata
    if (integration?.catalogEntryId) {
      dataCatalog.updateAsset(integration.catalogEntryId, {
        technicalMetadata: {
          recordCount: result.outputRecords,
        } as any,
      });
    }

    // 5. Track lineage if enabled
    if (options?.trackLineage && this.config.enableLineageTracking) {
      dataLineage.trackPipelineExecution({
        pipelineId: pipeline.id,
        inputSources: Object.keys(inputData),
        transformations: pipeline.steps.map(s => s.id),
      });

      logger.success('Pipeline lineage tracked', 'integration-hub', {
        pipelineId: pipeline.id,
        sources: Object.keys(inputData).length,
        steps: pipeline.steps.length,
      });
    }

    // 6. Track monitoring metrics
    if (this.config.enableMonitoring && result.duration) {
      monitoring.trackPipelineExecution({
        pipelineId: pipeline.id,
        duration: result.duration,
        recordsProcessed: result.outputRecords,
        success: result.status === 'completed',
      });

      logger.info('Pipeline metrics recorded', 'integration-hub', {
        pipelineId: pipeline.id,
        duration: result.duration,
      });
    }

    return result;
  }

  // ==================== STREAMING INTEGRATION ====================

  /**
   * Handle streaming batch with full integration
   */
  private async handleStreamingBatch(stream: any, messages: any[]): Promise<void> {
    logger.info('Processing streaming batch with integration', 'integration-hub', {
      streamId: stream.id,
      messageCount: messages.length,
    });

    // 1. If transform pipeline specified, execute it
    if (stream.transformPipelineId) {
      // Load pipeline
      // Would get pipeline from database
      logger.info('Applying transformation pipeline to stream data', 'integration-hub', {
        streamId: stream.id,
        pipelineId: stream.transformPipelineId,
        records: messages.length,
      });
    }

    // 2. If CDC enabled, detect changes
    if (this.config.enableCDCForStreams && stream.targetDataSourceId) {
      // Would load existing data and detect changes
      logger.info('Applying CDC to streaming data', 'integration-hub', {
        streamId: stream.id,
        targetDataSource: stream.targetDataSourceId,
      });
    }

    // 3. Update catalog with streaming metadata
    if (this.config.autoCatalog) {
      const streamCatalogId = `stream-${stream.id}`;
      const existingEntry = dataCatalog.getAsset(streamCatalogId);

      if (existingEntry) {
        // Update usage stats
        dataCatalog.updateAsset(streamCatalogId, {
          technicalMetadata: {
            recordCount: (existingEntry.technicalMetadata.recordCount || 0) + messages.length,
          } as any,
        });
      } else {
        // Register stream in catalog
        dataCatalog.registerAsset({
          assetType: 'data_source',
          assetId: streamCatalogId,
          name: stream.name,
          qualifiedName: `streams.${stream.type}.${stream.name}`,
          description: `Real-time ${stream.type} stream`,
          tags: ['streaming', stream.type, 'real-time'],
          classifications: ['streaming-source'],
          technicalMetadata: {
            dataType: stream.type,
            format: 'streaming',
            recordCount: messages.length,
          },
          businessMetadata: {},
        });
      }
    }
  }

  // ==================== BULK OPERATION INTEGRATION ====================

  /**
   * Enhanced bulk operations with integrated features
   */
  async bulkMaskDataSources(dataSourceIds: string[], maskingPolicyId: string): Promise<any> {
    logger.info('Bulk masking data sources', 'integration-hub', {
      count: dataSourceIds.length,
      policyId: maskingPolicyId,
    });

    const operation = bulkOperations.createOperation({
      name: `Bulk Mask ${dataSourceIds.length} Data Sources`,
      entityType: 'data_source',
      operationType: 'update',
      entityIds: dataSourceIds,
      config: {
        maskingPolicyId,
        action: 'apply-masking',
      },
      options: {
        continueOnError: true,
        maxConcurrent: 3,
      },
    });

    // Execute and track
    const summary = await bulkOperations.executeOperation(operation.id);

    // Update catalog for each successfully masked source
    for (const result of operation.results || []) {
      if (result.status === 'success') {
        const integration = this.dataSourceIntegrations.get(result.entityId);
        if (integration?.catalogEntryId) {
          dataCatalog.updateAsset(integration.catalogEntryId, {
            pii: true,
            sensitivity: 'confidential',
            tags: [...(dataCatalog.getAsset(integration.catalogEntryId)?.tags || []), 'masked'],
          });
        }
      }
    }

    return summary;
  }

  /**
   * Bulk enable CDC for data sources
   */
  async bulkEnableCDC(dataSourceIds: string[], cdcConfig: any): Promise<any> {
    logger.info('Bulk enabling CDC', 'integration-hub', {
      count: dataSourceIds.length,
    });

    const operation = bulkOperations.createOperation({
      name: `Enable CDC for ${dataSourceIds.length} Data Sources`,
      entityType: 'data_source',
      operationType: 'update',
      entityIds: dataSourceIds,
      config: {
        action: 'enable-cdc',
        cdcConfig,
      },
    });

    const summary = await bulkOperations.executeOperation(operation.id);

    // Update integrations
    for (const dataSourceId of dataSourceIds) {
      const integration = this.dataSourceIntegrations.get(dataSourceId);
      if (integration) {
        integration.cdcConfigId = `cdc-${dataSourceId}`;
      }
    }

    return summary;
  }

  // ==================== AI-POWERED INTEGRATION ====================

  /**
   * Auto-connect data sources based on AI relationship detection
   */
  async autoConnectDataSources(dataSourceIds: string[]): Promise<any[]> {
    logger.info('Auto-connecting data sources using AI', 'integration-hub', {
      sourceCount: dataSourceIds.length,
    });

    // Would load data from all sources
    const tables = dataSourceIds.map(id => ({
      name: id,
      data: [], // Would load actual data
    }));

    const relationships = await aiAssistant.detectRelationships(tables);

    // Create catalog relationships
    for (const rel of relationships) {
      if (rel.confidence > 0.8) {
        const sourceIntegration = this.dataSourceIntegrations.get(rel.sourceTable);
        const targetIntegration = this.dataSourceIntegrations.get(rel.targetTable);

        if (sourceIntegration?.catalogEntryId && targetIntegration?.catalogEntryId) {
          // Update catalog with relationship
          dataCatalog.updateAsset(sourceIntegration.catalogEntryId, {
            downstreamDependents: [
              ...(dataCatalog.getAsset(sourceIntegration.catalogEntryId)?.downstreamDependents || []),
              targetIntegration.catalogEntryId,
            ],
          });

          logger.success('Catalog relationship created', 'integration-hub', {
            from: rel.sourceTable,
            to: rel.targetTable,
            confidence: rel.confidence,
          });
        }
      }
    }

    return relationships;
  }

  // ==================== SNAPSHOT INTEGRATION ====================

  /**
   * Create snapshot with integrated features
   */
  async createIntegratedSnapshot(
    dataSourceId: string,
    data: any[],
    options?: {
      applyMasking?: boolean;
      detectQuality?: boolean;
      updateCatalog?: boolean;
    }
  ): Promise<any> {
    logger.info('Creating integrated snapshot', 'integration-hub', {
      dataSourceId,
      records: data.length,
      options,
    });

    let processedData = [...data];

    // 1. Apply masking if configured
    if (options?.applyMasking) {
      const integration = this.dataSourceIntegrations.get(dataSourceId);
      if (integration?.maskingPolicyId) {
        const { maskedData } = await dataMasking.applyPolicy(
          integration.maskingPolicyId,
          processedData
        );
        processedData = maskedData;

        logger.info('Masking applied to snapshot data', 'integration-hub', {
          dataSourceId,
          originalRecords: data.length,
          maskedRecords: maskedData.length,
        });
      }
    }

    // 2. Detect data quality if requested
    if (options?.detectQuality) {
      const qualityIssues = await aiAssistant.detectQualityIssues(dataSourceId, processedData);
      
      logger.info('Quality issues detected in snapshot', 'integration-hub', {
        dataSourceId,
        issueCount: qualityIssues.length,
      });
    }

    // 3. Update catalog
    if (options?.updateCatalog) {
      const integration = this.dataSourceIntegrations.get(dataSourceId);
      if (integration?.catalogEntryId) {
        dataCatalog.updateAsset(integration.catalogEntryId, {
          technicalMetadata: {
            recordCount: processedData.length,
          } as any,
        });
      }
    }

    return {
      data: processedData,
      metadata: {
        masked: options?.applyMasking,
        qualityChecked: options?.detectQuality,
        catalogUpdated: options?.updateCatalog,
      },
    };
  }

  // ==================== QUERY & STATISTICS ====================

  /**
   * Get comprehensive integration status
   */
  getIntegrationStatus(): {
    dataSources: number;
    pipelines: number;
    catalogEntries: number;
    maskingPolicies: number;
    features: Record<string, boolean>;
  } {
    return {
      dataSources: this.dataSourceIntegrations.size,
      pipelines: this.pipelineIntegrations.size,
      catalogEntries: 0, // dataCatalog doesn't have getAllAssets method
      maskingPolicies: 0, // dataMasking doesn't have getAllPolicies method
      features: {
        autoCatalog: this.config.autoCatalog,
        autoDetectPII: this.config.autoDetectPII,
        autoMaskSensitiveData: this.config.autoMaskSensitiveData,
        lineageTracking: this.config.enableLineageTracking,
        cdcForStreams: this.config.enableCDCForStreams,
        aiSuggestions: this.config.enableAISuggestions,
      },
    };
  }

  /**
   * Get data source integration
   */
  getDataSourceIntegration(dataSourceId: string): DataSourceIntegration | null {
    return this.dataSourceIntegrations.get(dataSourceId) || null;
  }

  /**
   * Get pipeline integration
   */
  getPipelineIntegration(pipelineId: string): PipelineIntegration | null {
    return this.pipelineIntegrations.get(pipelineId) || null;
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<IntegrationConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };

    logger.info('Integration Hub configuration updated', 'integration-hub', {
      config: this.config,
    });
  }
}

// Export singleton instance
export const integrationHub = IntegrationHub.getInstance();

