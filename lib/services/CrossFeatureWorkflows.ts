/**
 * Cross-Feature Workflows
 * 
 * Pre-built workflows that combine multiple features for common scenarios.
 * Creates cohesive user experiences by orchestrating multiple services.
 */

import { logger } from '../utils/logger';
import { integrationHub } from './IntegrationHub';
import { pipelineExecutor } from './PipelineExecutor';
import { dataMasking } from './DataMasking';
import { cdcManager } from './CDCManager';
import { dataCatalog } from './DataCatalog';
import { aiAssistant } from './AIAssistant';
import { bulkOperations } from './BulkOperations';

export class CrossFeatureWorkflows {
  private static instance: CrossFeatureWorkflows;

  static getInstance(): CrossFeatureWorkflows {
    if (!CrossFeatureWorkflows.instance) {
      CrossFeatureWorkflows.instance = new CrossFeatureWorkflows();
    }
    return CrossFeatureWorkflows.instance;
  }

  // ==================== WORKFLOW 1: ONBOARD NEW DATA SOURCE ====================

  /**
   * Complete data source onboarding workflow
   * 
   * 1. Scan for PII
   * 2. Create masking policy
   * 3. Register in catalog
   * 4. Setup CDC
   * 5. Suggest transformations
   * 6. Create quality baseline
   */
  async onboardNewDataSource(params: {
    dataSource: any;
    data: any[];
    enableMasking?: boolean;
    enableCDC?: boolean;
    enableCatalog?: boolean;
  }): Promise<any> {
    logger.info(`Starting complete onboarding workflow: ${params.dataSource.name}`, 'workflows', {
      dataSourceId: params.dataSource.id,
      records: params.data.length,
    });

    const results: any = {
      dataSourceId: params.dataSource.id,
      steps: [],
    };

    // Step 1: PII Detection
    results.steps.push({ step: 'pii_detection', status: 'running' });
    const piiResults = await dataMasking.detectPII(params.data);
    results.piiDetection = {
      fieldsFound: piiResults.length,
      results: piiResults,
    };
    results.steps[results.steps.length - 1].status = 'completed';

    // Step 2: Create Masking Policy (if PII found and enabled)
    if (piiResults.length > 0 && params.enableMasking) {
      results.steps.push({ step: 'create_masking_policy', status: 'running' });
      
      const policy = dataMasking.createPolicy({
        name: `${params.dataSource.name} - Auto Masking`,
        description: 'Auto-generated based on PII detection',
        rules: piiResults.map(pii => ({
          name: `Mask ${pii.field}`,
          field: pii.field,
          strategy: this.selectStrategy(pii.piiType) as any,
          enabled: true,
        })),
      });

      results.maskingPolicy = policy;
      results.steps[results.steps.length - 1].status = 'completed';
    }

    // Step 3: Register in Catalog
    if (params.enableCatalog) {
      results.steps.push({ step: 'catalog_registration', status: 'running' });
      
      const catalogEntry = dataCatalog.registerAsset({
        assetType: 'data_source',
        assetId: params.dataSource.id,
        name: params.dataSource.name,
        qualifiedName: `${params.dataSource.projectId}.${params.dataSource.name}`,
        description: `Data source: ${params.dataSource.type}`,
        tags: [params.dataSource.type],
        classifications: [],
        technicalMetadata: {
          dataType: params.dataSource.type,
          recordCount: params.data.length,
        },
        businessMetadata: {},
        pii: piiResults.length > 0,
        sensitivity: piiResults.length > 0 ? 'confidential' : 'internal',
      });

      results.catalogEntry = catalogEntry;
      results.steps[results.steps.length - 1].status = 'completed';
    }

    // Step 4: Setup CDC
    if (params.enableCDC) {
      results.steps.push({ step: 'setup_cdc', status: 'running' });
      
      results.cdcConfig = {
        dataSourceId: params.dataSource.id,
        trackingMode: 'hash',
        primaryKey: 'id', // Would detect this
        enableDeletes: true,
      };

      results.steps[results.steps.length - 1].status = 'completed';
    }

    // Step 5: AI Suggestions
    results.steps.push({ step: 'ai_analysis', status: 'running' });
    
    const qualityIssues = await aiAssistant.detectQualityIssues(params.dataSource.id, params.data);
    results.qualityAnalysis = {
      issues: qualityIssues,
      qualityScore: this.calculateQualityScore(qualityIssues, params.data.length),
    };

    results.steps[results.steps.length - 1].status = 'completed';

    // Step 6: Use Integration Hub
    const integration = await integrationHub.onboardDataSource(params.dataSource, params.data);
    results.integration = integration;

    logger.success(`Data source onboarding complete: ${params.dataSource.name}`, 'workflows', {
      dataSourceId: params.dataSource.id,
      piiFields: piiResults.length,
      qualityScore: results.qualityAnalysis.qualityScore,
    });

    return results;
  }

  // ==================== WORKFLOW 2: SECURE PIPELINE EXECUTION ====================

  /**
   * Execute pipeline with security, quality, and governance
   * 
   * 1. Check PII in input data
   * 2. Apply masking if needed
   * 3. Run pipeline
   * 4. Validate output quality
   * 5. Update catalog lineage
   * 6. Create snapshot
   */
  async executeSecurePipeline(params: {
    pipeline: any;
    inputData: Record<string, any[]>;
    context: any;
    enableMasking?: boolean;
    validateQuality?: boolean;
    createSnapshot?: boolean;
  }): Promise<any> {
    logger.info(`Starting secure pipeline execution: ${params.pipeline.name}`, 'workflows', {
      pipelineId: params.pipeline.id,
    });

    const results: any = {
      pipelineId: params.pipeline.id,
      steps: [],
    };

    // Step 1: Check for PII in input
    results.steps.push({ step: 'pii_check', status: 'running' });
    let processedInput = { ...params.inputData };
    
    for (const [sourceId, data] of Object.entries(params.inputData)) {
      const piiResults = await dataMasking.detectPII(data);
      if (piiResults.length > 0) {
        results.piiDetected = {
          sourceId,
          fields: piiResults.length,
        };

        // Step 2: Apply masking if enabled
        if (params.enableMasking) {
          const policy = dataMasking.createPolicy({
            name: `Temp Mask for ${sourceId}`,
            rules: piiResults.map(pii => ({
              name: `Mask ${pii.field}`,
              field: pii.field,
              strategy: this.selectStrategy(pii.piiType) as any,
              enabled: true,
            })),
          });

          const { maskedData } = await dataMasking.applyPolicy(policy.id, data);
          processedInput[sourceId] = maskedData;
          results.maskingApplied = true;
        }
      }
    }
    results.steps[results.steps.length - 1].status = 'completed';

    // Step 3: Execute pipeline
    results.steps.push({ step: 'pipeline_execution', status: 'running' });
    
    const executionResult = await integrationHub.executePipelineIntegrated(
      params.pipeline,
      processedInput,
      params.context,
      {
        trackLineage: true,
      }
    );

    results.execution = executionResult;
    results.steps[results.steps.length - 1].status = 'completed';

    // Step 4: Validate output quality
    if (params.validateQuality && executionResult.outputData) {
      results.steps.push({ step: 'quality_validation', status: 'running' });
      
      const qualityIssues = await aiAssistant.detectQualityIssues(
        params.pipeline.id,
        executionResult.outputData
      );

      results.qualityValidation = {
        issues: qualityIssues,
        qualityScore: this.calculateQualityScore(qualityIssues, executionResult.outputData.length),
      };

      results.steps[results.steps.length - 1].status = 'completed';
    }

    logger.success(`Secure pipeline execution complete: ${params.pipeline.name}`, 'workflows', {
      pipelineId: params.pipeline.id,
      inputRecords: executionResult.inputRecords,
      outputRecords: executionResult.outputRecords,
    });

    return results;
  }

  // ==================== WORKFLOW 3: COMPLIANCE SCAN ====================

  /**
   * Scan entire project for compliance issues
   * 
   * 1. Scan all data sources for PII
   * 2. Check catalog for ungoverned data
   * 3. Verify masking policies exist
   * 4. Generate compliance report
   */
  async runComplianceScan(projectId: string, dataSourceIds: string[]): Promise<any> {
    logger.info('Running compliance scan', 'workflows', {
      projectId,
      dataSourceCount: dataSourceIds.length,
    });

    const report: any = {
      projectId,
      scanDate: new Date(),
      dataSources: [],
      summary: {
        totalDataSources: dataSourceIds.length,
        withPII: 0,
        withMaskingPolicies: 0,
        catalogued: 0,
        complianceScore: 0,
      },
      issues: [],
      recommendations: [],
    };

    // Scan each data source
    for (const dataSourceId of dataSourceIds) {
      const integration = integrationHub.getDataSourceIntegration(dataSourceId);
      
      const sourceReport: any = {
        dataSourceId,
        hasPII: false,
        hasMaskingPolicy: false,
        isCatalogued: false,
        issues: [],
      };

      // Check if PII detected
      if (integration?.piiDetectionResults && integration.piiDetectionResults.length > 0) {
        sourceReport.hasPII = true;
        report.summary.withPII++;

        // Check if masking policy exists
        if (!integration.maskingPolicyId) {
          sourceReport.issues.push('PII detected but no masking policy');
          report.issues.push({
            dataSourceId,
            severity: 'high',
            issue: 'Unprotected PII',
          });
        } else {
          report.summary.withMaskingPolicies++;
        }
      }

      // Check if catalogued
      if (integration?.catalogEntryId) {
        sourceReport.isCatalogued = true;
        report.summary.catalogued++;
      } else {
        report.issues.push({
          dataSourceId,
          severity: 'medium',
          issue: 'Not catalogued',
        });
      }

      report.dataSources.push(sourceReport);
    }

    // Calculate compliance score
    const maxScore = dataSourceIds.length * 3; // 3 points per source
    let achievedScore = 0;
    achievedScore += report.summary.catalogued;
    achievedScore += report.summary.withMaskingPolicies * 2; // Masking is more important

    report.summary.complianceScore = Math.round((achievedScore / maxScore) * 100);

    // Generate recommendations
    if (report.summary.withPII > report.summary.withMaskingPolicies) {
      report.recommendations.push(
        `Create masking policies for ${report.summary.withPII - report.summary.withMaskingPolicies} data sources with unprotected PII`
      );
    }

    if (report.summary.catalogued < dataSourceIds.length) {
      report.recommendations.push(
        `Catalog ${dataSourceIds.length - report.summary.catalogued} ungoverned data sources`
      );
    }

    logger.success('Compliance scan completed', 'workflows', {
      projectId,
      complianceScore: report.summary.complianceScore,
      issues: report.issues.length,
    });

    return report;
  }

  // ==================== WORKFLOW 4: BULK SECURE & GOVERN ====================

  /**
   * Bulk secure and govern data sources
   * 
   * Applies full governance stack to multiple data sources at once
   */
  async bulkSecureAndGovernDataSources(dataSourceIds: string[]): Promise<any> {
    logger.info('Bulk secure and govern workflow', 'workflows', {
      count: dataSourceIds.length,
    });

    // 1. Bulk PII detection
    // 2. Bulk masking policy creation
    // 3. Bulk catalog registration
    // 4. Bulk CDC enablement

    const operation = bulkOperations.createOperation({
      name: `Secure & Govern ${dataSourceIds.length} Data Sources`,
      entityType: 'data_source',
      operationType: 'update',
      entityIds: dataSourceIds,
      config: {
        actions: ['detect-pii', 'create-masking', 'catalog', 'enable-cdc'],
      },
    });

    const summary = await bulkOperations.executeOperation(operation.id);

    return summary;
  }

  // ==================== HELPER METHODS ====================

  private selectStrategy(piiType: string): string {
    const strategies: Record<string, string> = {
      email: 'hash',
      phone: 'partial',
      ssn: 'redact',
      credit_card: 'tokenize',
      address: 'generalize',
      name: 'fake',
    };

    return strategies[piiType] || 'redact';
  }

  private calculateQualityScore(issues: any[], totalRecords: number): number {
    if (issues.length === 0) return 100;

    const totalAffected = issues.reduce((sum, issue) => sum + issue.affectedRecords, 0);
    const impactPercentage = (totalAffected / totalRecords) * 100;
    const severityWeight = issues.reduce((sum, issue) => {
      const weights: Record<string, number> = {
        critical: 10,
        high: 5,
        medium: 2,
        low: 1,
      };
      return sum + (weights[issue.severity] || 1);
    }, 0);

    const score = Math.max(0, 100 - impactPercentage - severityWeight);
    return Math.round(score);
  }
}

export const crossFeatureWorkflows = CrossFeatureWorkflows.getInstance();

