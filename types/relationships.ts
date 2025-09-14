import { DataSource } from "./index";

export interface ComplexRelationship {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dataSourceIds: string[];
  relationshipTree: RelationshipNode;
  joinStrategy: "inner" | "left" | "right" | "full";
  aggregationRules?: AggregationRule[];
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface RelationshipNode {
  id: string;
  dataSourceId: string;
  parentId?: string;
  children: RelationshipNode[];
  relationship?: RelationshipLink;
  joinType: "inner" | "left" | "right" | "full";
  level: number;
  position: { x: number; y: number };
}

export interface RelationshipLink {
  id: string;
  sourceDataSourceId: string;
  targetDataSourceId: string;
  sourceColumn: string;
  targetColumn: string;
  relationshipType:
    | "one_to_one"
    | "one_to_many"
    | "many_to_one"
    | "many_to_many";
  joinCondition: string;
  confidence: number;
  isActive: boolean;
}

export interface AggregationRule {
  id: string;
  dataSourceId: string;
  column: string;
  operation: "sum" | "avg" | "count" | "max" | "min" | "group_concat";
  alias?: string;
  groupBy?: boolean;
}

export interface RelationshipPath {
  id: string;
  path: string[]; // Array of data source IDs representing the path
  relationships: RelationshipLink[];
  joinType: "inner" | "left" | "right" | "full";
  estimatedRows: number;
  complexity: "simple" | "moderate" | "complex";
}

export interface TreeLayout {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
}

export interface TreeNode {
  id: string;
  dataSourceId: string;
  dataSourceName: string;
  dataSourceType: string;
  recordCount: number;
  position: { x: number; y: number };
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  children: string[];
  parent?: string;
}

export interface TreeEdge {
  id: string;
  source: string;
  target: string;
  relationship: RelationshipLink;
  isActive: boolean;
  confidence: number;
}

export interface RelationshipSuggestion {
  id: string;
  sourceDataSourceId: string;
  targetDataSourceId: string;
  sourceColumn: string;
  targetColumn: string;
  sourceTableName: string;
  targetTableName: string;
  relationshipType:
    | "one_to_one"
    | "one_to_many"
    | "many_to_one"
    | "many_to_many";
  confidence: number;
  reasoning: string;
  sampleValues?: {
    source: any[];
    target: any[];
  };
  isActive: boolean;
}

export interface ComplexJoinPlan {
  id: string;
  name: string;
  description?: string;
  executionOrder: JoinStep[];
  estimatedRows: number;
  complexity: number;
  performance: "fast" | "moderate" | "slow";
  isValid: boolean;
  validationErrors?: string[];
}

export interface JoinStep {
  id: string;
  stepNumber: number;
  leftDataSourceId?: string;
  rightDataSourceId: string;
  relationship: RelationshipLink;
  joinType: "inner" | "left" | "right" | "full";
  estimatedRows: number;
  isIntermediate: boolean;
  intermediateTableName?: string;
}

// Utility types for relationship analysis
export interface ColumnMatch {
  sourceColumn: string;
  targetColumn: string;
  dataType: string;
  matchType: "exact" | "similar" | "compatible";
  confidence: number;
  sampleValues: {
    source: any[];
    target: any[];
  };
}

export interface DataSourceAnalysis {
  dataSourceId: string;
  dataSourceName: string;
  columns: ColumnAnalysis[];
  relationships: RelationshipSuggestion[];
  potentialJoins: string[];
  recordCount: number;
  uniqueValues: Record<string, number>;
}

export interface ColumnAnalysis {
  name: string;
  type: string;
  unique: boolean;
  nullable: boolean;
  sampleValues: any[];
  distinctCount: number;
  isIdColumn: boolean;
  isForeignKey: boolean;
  potentialMatches: string[];
}
