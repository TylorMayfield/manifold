/**
 * Data Dictionary Types
 * 
 * Provides comprehensive metadata and documentation for data sources,
 * fields, and relationships within the data management system.
 */

export interface DataDictionaryEntry {
  id: string;
  projectId: string;
  dataSourceId: string;
  
  // Basic metadata
  businessName: string;
  technicalName: string;
  description: string;
  purpose?: string;
  
  // Classification
  category?: string;
  tags: string[];
  domain?: string; // Business domain (e.g., "Sales", "Marketing", "Finance")
  
  // Field definitions
  fields: FieldDefinition[];
  
  // Relationships
  relationships: DataRelationship[];
  
  // Data quality and governance
  dataQuality?: DataQualityMetrics;
  governance?: GovernanceInfo;
  
  // Usage and lineage
  usage?: UsageInfo;
  lineage?: LineageInfo;
  
  // Metadata
  owner?: string;
  steward?: string;
  contactEmail?: string;
  documentation?: string;
  version?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface FieldDefinition {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  dataType: FieldDataType;
  
  // Technical properties
  technicalType?: string; // e.g., "VARCHAR(255)", "INT", "TIMESTAMP"
  length?: number;
  precision?: number;
  scale?: number;
  nullable: boolean;
  defaultValue?: any;
  
  // Constraints
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  isIndexed: boolean;
  
  // Foreign key information
  foreignKeyRef?: {
    dataSourceId: string;
    dataSourceName: string;
    fieldName: string;
    relationshipType: RelationshipType;
  };
  
  // Business metadata
  businessRules?: string[];
  validValues?: string[] | { value: any; label: string }[];
  format?: string;
  example?: any;
  
  // Data classification
  sensitivity?: DataSensitivity;
  classification?: DataClassification;
  
  // Quality metrics
  qualityScore?: number;
  completeness?: number; // Percentage of non-null values
  uniqueness?: number; // Percentage of unique values
  
  // Statistics
  statistics?: FieldStatistics;
  
  // Lineage
  derivedFrom?: string[]; // Array of source field IDs
  transformationLogic?: string;
  
  tags: string[];
  notes?: string;
  
  createdAt?: Date;
  updatedAt?: Date;
}

export type FieldDataType =
  | "string"
  | "number"
  | "integer"
  | "float"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "timestamp"
  | "time"
  | "json"
  | "array"
  | "object"
  | "binary"
  | "uuid"
  | "email"
  | "url"
  | "phone"
  | "currency"
  | "enum"
  | "unknown";

export type DataSensitivity =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | "pii" // Personally Identifiable Information
  | "pci"; // Payment Card Industry data

export type DataClassification =
  | "master_data"
  | "transactional"
  | "reference"
  | "metadata"
  | "derived"
  | "aggregated"
  | "historical"
  | "snapshot";

export interface FieldStatistics {
  distinctCount?: number;
  minValue?: any;
  maxValue?: any;
  avgValue?: number;
  medianValue?: any;
  mode?: any;
  standardDeviation?: number;
  nullCount?: number;
  totalCount?: number;
  topValues?: Array<{ value: any; count: number; percentage: number }>;
  lastCalculated?: Date;
}

export interface DataRelationship {
  id: string;
  type: RelationshipType;
  
  // Source (this data source)
  sourceDataSourceId: string;
  sourceFieldId: string;
  sourceFieldName: string;
  
  // Target (related data source)
  targetDataSourceId: string;
  targetDataSourceName: string;
  targetFieldId: string;
  targetFieldName: string;
  
  // Relationship details
  description?: string;
  relationshipStrength?: "strong" | "weak" | "inferred";
  cardinality?: string; // e.g., "1:1", "1:N", "N:M"
  
  // Join information
  joinType?: "inner" | "left" | "right" | "full" | "cross";
  joinCondition?: string;
  
  // Validation
  isValidated: boolean;
  validationDate?: Date;
  validationNotes?: string;
  
  // Metadata
  createdAt: Date;
  createdBy?: string;
}

export type RelationshipType =
  | "one_to_one"
  | "one_to_many"
  | "many_to_one"
  | "many_to_many"
  | "parent_child"
  | "lookup"
  | "aggregation"
  | "derived";

export interface DataQualityMetrics {
  overallScore?: number; // 0-100
  completeness?: number; // Percentage of filled fields
  accuracy?: number;
  consistency?: number;
  timeliness?: number;
  validity?: number;
  uniqueness?: number;
  
  issues?: DataQualityIssue[];
  lastAssessed?: Date;
  assessedBy?: string;
}

export interface DataQualityIssue {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  category: "completeness" | "accuracy" | "consistency" | "validity" | "timeliness" | "uniqueness";
  description: string;
  affectedFields?: string[];
  recordCount?: number;
  detectedAt: Date;
  status: "open" | "in_progress" | "resolved" | "wont_fix";
  resolution?: string;
}

export interface GovernanceInfo {
  dataOwner?: string;
  dataSteward?: string;
  businessOwner?: string;
  
  // Compliance
  complianceRequirements?: string[];
  retentionPolicy?: string;
  retentionPeriod?: string;
  
  // Access control
  accessLevel?: "public" | "internal" | "restricted" | "confidential";
  accessGroups?: string[];
  
  // Audit
  isAudited: boolean;
  auditFrequency?: string;
  lastAuditDate?: Date;
  nextAuditDate?: Date;
  
  // Privacy
  containsPII: boolean;
  piiFields?: string[];
  gdprApplicable?: boolean;
  dataResidency?: string;
  
  notes?: string;
}

export interface UsageInfo {
  accessCount?: number;
  lastAccessedAt?: Date;
  lastAccessedBy?: string;
  
  // Consumers
  consumers?: DataConsumer[];
  
  // Dependencies
  dependentSystems?: string[];
  dependentReports?: string[];
  dependentPipelines?: string[];
  
  // Usage patterns
  peakUsageTimes?: string[];
  averageQueryTime?: number;
  queryComplexity?: "simple" | "moderate" | "complex";
  
  // SLA
  sla?: {
    availability?: number; // Percentage
    refreshFrequency?: string;
    latency?: number; // milliseconds
  };
}

export interface DataConsumer {
  id: string;
  name: string;
  type: "user" | "application" | "service" | "report" | "pipeline";
  email?: string;
  department?: string;
  purpose?: string;
  frequency?: "real-time" | "hourly" | "daily" | "weekly" | "monthly" | "on-demand";
  lastAccessed?: Date;
}

export interface LineageInfo {
  // Upstream sources (where this data comes from)
  upstream: LineageNode[];
  
  // Downstream targets (where this data goes to)
  downstream: LineageNode[];
  
  // Transformation history
  transformations?: TransformationStep[];
  
  // Data flow
  dataFlow?: DataFlowPath[];
  
  lastTracedAt?: Date;
}

export interface LineageNode {
  id: string;
  type: "data_source" | "database" | "api" | "file" | "pipeline" | "transformation" | "report";
  name: string;
  description?: string;
  
  // Connection details
  connectionType?: string;
  lastSyncAt?: Date;
  
  // Impact
  isActive: boolean;
  isCritical?: boolean;
  
  // Metadata
  owner?: string;
  tags?: string[];
}

export interface TransformationStep {
  id: string;
  order: number;
  type: "filter" | "map" | "aggregate" | "join" | "union" | "custom";
  name: string;
  description?: string;
  logic?: string;
  appliedAt?: Date;
  appliedBy?: string;
}

export interface DataFlowPath {
  id: string;
  path: LineageNode[];
  flowType: "batch" | "streaming" | "real-time" | "on-demand";
  frequency?: string;
  latency?: number;
  volumePerExecution?: number;
  lastExecuted?: Date;
}

// Search and filtering
export interface DictionarySearchCriteria {
  query?: string;
  dataSourceIds?: string[];
  categories?: string[];
  tags?: string[];
  domains?: string[];
  sensitivity?: DataSensitivity[];
  classification?: DataClassification[];
  owner?: string;
  hasRelationships?: boolean;
  qualityScoreMin?: number;
  qualityScoreMax?: number;
}

export interface DictionarySearchResult {
  entries: DataDictionaryEntry[];
  totalCount: number;
  facets?: {
    categories: Array<{ value: string; count: number }>;
    tags: Array<{ value: string; count: number }>;
    domains: Array<{ value: string; count: number }>;
    owners: Array<{ value: string; count: number }>;
  };
}

// Export/Import formats
export interface DictionaryExport {
  version: string;
  exportedAt: Date;
  exportedBy?: string;
  projectId: string;
  entries: DataDictionaryEntry[];
  metadata?: {
    totalEntries: number;
    totalFields: number;
    totalRelationships: number;
  };
}

// View models for UI
export interface DictionaryViewModel {
  entry: DataDictionaryEntry;
  dataSource?: {
    id: string;
    name: string;
    type: string;
    status?: string;
  };
  relatedEntries?: Array<{
    id: string;
    businessName: string;
    technicalName: string;
    relationshipType: RelationshipType;
  }>;
  fieldCount: number;
  relationshipCount: number;
  qualityScore?: number;
}

// Bulk operations
export interface BulkDictionaryOperation {
  operation: "create" | "update" | "delete" | "tag" | "categorize";
  entryIds: string[];
  data?: Partial<DataDictionaryEntry>;
}

export interface BulkOperationResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
}

