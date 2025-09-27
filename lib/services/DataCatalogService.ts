import { clientLogger } from "../utils/ClientLogger";

export interface DataCatalogEntry {
  id: string;
  name: string;
  type: "table" | "view" | "model" | "dataset" | "api" | "file";
  description?: string;
  tags: string[];
  owner: string;
  dataSourceId: string;
  schema: DataSchema;
  metadata: DataMetadata;
  quality: DataQuality;
  lineage: DataLineage;
  access: DataAccess;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
}

export interface DataSchema {
  columns: SchemaColumn[];
  primaryKeys: string[];
  foreignKeys: ForeignKey[];
  indexes: Index[];
  constraints: Constraint[];
  statistics: SchemaStatistics;
}

export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  description?: string;
  examples: any[];
  statistics: ColumnStatistics;
}

export interface ColumnStatistics {
  count: number;
  nullCount: number;
  uniqueCount: number;
  min?: any;
  max?: any;
  mean?: number;
  median?: number;
  mode?: any;
  standardDeviation?: number;
  distribution: Record<string, number>;
}

export interface ForeignKey {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  relationship: "one-to-one" | "one-to-many" | "many-to-many";
}

export interface Index {
  name: string;
  columns: string[];
  type: "primary" | "unique" | "index";
  isUnique: boolean;
}

export interface Constraint {
  name: string;
  type: "check" | "not_null" | "unique" | "foreign_key";
  expression?: string;
  columns: string[];
}

export interface SchemaStatistics {
  totalRows: number;
  totalColumns: number;
  totalSize: number; // bytes
  lastAnalyzed: Date;
  rowCountEstimate?: number;
}

export interface DataMetadata {
  source: {
    type: string;
    location: string;
    connectionString?: string;
    credentials?: any;
  };
  format: {
    type: string;
    encoding?: string;
    compression?: string;
    delimiter?: string;
  };
  business: {
    domain: string;
    category: string;
    purpose: string;
    stakeholders: string[];
    businessRules: string[];
  };
  technical: {
    refreshFrequency: string;
    retentionPolicy: string;
    backupStrategy: string;
    versioning: boolean;
    changeLog: ChangeLogEntry[];
  };
}

export interface ChangeLogEntry {
  version: string;
  date: Date;
  author: string;
  description: string;
  changes: string[];
}

export interface DataQuality {
  score: number; // 0-100
  lastChecked: Date;
  checks: QualityCheck[];
  issues: QualityIssue[];
  trends: QualityTrend[];
}

export interface QualityCheck {
  id: string;
  name: string;
  type: string;
  status: "passed" | "failed" | "warning";
  score: number;
  lastRun: Date;
  details: any;
}

export interface QualityIssue {
  id: string;
  type: string;
  severity: "error" | "warning" | "info";
  message: string;
  affectedRows: number;
  firstDetected: Date;
  lastDetected: Date;
  status: "open" | "acknowledged" | "resolved";
}

export interface QualityTrend {
  date: Date;
  score: number;
  issues: number;
}

export interface DataLineage {
  upstream: LineageNode[];
  downstream: LineageNode[];
  transformations: Transformation[];
  lastUpdated: Date;
}

export interface LineageNode {
  id: string;
  name: string;
  type: string;
  relationship: "direct" | "indirect";
  distance: number;
}

export interface Transformation {
  id: string;
  name: string;
  type: string;
  description: string;
  inputColumns: string[];
  outputColumns: string[];
  logic: string;
  lastExecuted: Date;
}

export interface DataAccess {
  permissions: Permission[];
  users: UserAccess[];
  groups: GroupAccess[];
  lastAudit: Date;
}

export interface Permission {
  id: string;
  name: string;
  type: "read" | "write" | "admin";
  conditions: string[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export interface UserAccess {
  userId: string;
  userName: string;
  permissions: string[];
  lastAccessed: Date;
  accessCount: number;
}

export interface GroupAccess {
  groupId: string;
  groupName: string;
  permissions: string[];
  memberCount: number;
  lastAccessed: Date;
}

export class DataCatalogService {
  private static instance: DataCatalogService;
  private catalog: Map<string, DataCatalogEntry> = new Map();
  private searchIndex: Map<string, string[]> = new Map();

  static getInstance(): DataCatalogService {
    if (!DataCatalogService.instance) {
      DataCatalogService.instance = new DataCatalogService();
    }
    return DataCatalogService.instance;
  }

  // Entry Management
  async addEntry(
    entry: Omit<DataCatalogEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const id = `catalog_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const now = new Date();

    const newEntry: DataCatalogEntry = {
      ...entry,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.catalog.set(id, newEntry);
    this.updateSearchIndex(id, newEntry);

    clientLogger.info("Data catalog entry added", "system", {
      entryId: id,
      name: entry.name,
      type: entry.type,
    });

    return id;
  }

  async updateEntry(
    entryId: string,
    updates: Partial<DataCatalogEntry>
  ): Promise<boolean> {
    const entry = this.catalog.get(entryId);
    if (!entry) return false;

    const updatedEntry = {
      ...entry,
      ...updates,
      updatedAt: new Date(),
    };

    this.catalog.set(entryId, updatedEntry);
    this.updateSearchIndex(entryId, updatedEntry);

    clientLogger.info("Data catalog entry updated", "system", {
      entryId,
      updates: Object.keys(updates),
    });

    return true;
  }

  async removeEntry(entryId: string): Promise<boolean> {
    const entry = this.catalog.get(entryId);
    if (!entry) return false;

    this.catalog.delete(entryId);
    this.searchIndex.delete(entryId);

    clientLogger.info("Data catalog entry removed", "system", {
      entryId,
      name: entry.name,
    });

    return true;
  }

  // Search and Discovery
  async search(
    query: string,
    filters?: SearchFilters
  ): Promise<DataCatalogEntry[]> {
    const results: DataCatalogEntry[] = [];
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/);

    for (const [entryId, entry] of this.catalog) {
      if (
        this.matchesQuery(entry, queryTerms) &&
        this.matchesFilters(entry, filters)
      ) {
        results.push(entry);
      }
    }

    // Sort by relevance (simple scoring)
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryTerms);
      const scoreB = this.calculateRelevanceScore(b, queryTerms);
      return scoreB - scoreA;
    });

    return results;
  }

  private matchesQuery(entry: DataCatalogEntry, queryTerms: string[]): boolean {
    const searchableText = [
      entry.name,
      entry.description || "",
      entry.tags.join(" "),
      entry.schema.columns.map((c) => c.name).join(" "),
      entry.metadata.business.domain,
      entry.metadata.business.category,
      entry.metadata.business.purpose,
    ]
      .join(" ")
      .toLowerCase();

    return queryTerms.every((term) => searchableText.includes(term));
  }

  private matchesFilters(
    entry: DataCatalogEntry,
    filters?: SearchFilters
  ): boolean {
    if (!filters) return true;

    if (filters.type && entry.type !== filters.type) return false;
    if (filters.owner && entry.owner !== filters.owner) return false;
    if (filters.tags && !filters.tags.every((tag) => entry.tags.includes(tag)))
      return false;
    if (filters.dataSourceId && entry.dataSourceId !== filters.dataSourceId)
      return false;
    if (
      filters.minQualityScore &&
      entry.quality.score < filters.minQualityScore
    )
      return false;

    return true;
  }

  private calculateRelevanceScore(
    entry: DataCatalogEntry,
    queryTerms: string[]
  ): number {
    let score = 0;
    const nameLower = entry.name.toLowerCase();
    const descriptionLower = (entry.description || "").toLowerCase();

    for (const term of queryTerms) {
      if (nameLower.includes(term)) score += 10;
      if (descriptionLower.includes(term)) score += 5;
      if (entry.tags.some((tag) => tag.toLowerCase().includes(term)))
        score += 3;
      if (
        entry.schema.columns.some((col) =>
          col.name.toLowerCase().includes(term)
        )
      )
        score += 2;
    }

    return score;
  }

  // Schema Analysis
  async analyzeSchema(dataSourceId: string, data: any[]): Promise<DataSchema> {
    if (data.length === 0) {
      return {
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
      };
    }

    const sampleRecord = data[0];
    const columns: SchemaColumn[] = [];
    const columnNames = Object.keys(sampleRecord);

    for (const columnName of columnNames) {
      const columnData = data.map((record) => record[columnName]);
      const statistics = this.calculateColumnStatistics(columnData);

      columns.push({
        name: columnName,
        type: this.inferColumnType(columnData),
        nullable: statistics.nullCount > 0,
        examples: this.getColumnExamples(columnData),
        statistics,
      });
    }

    return {
      columns,
      primaryKeys: this.detectPrimaryKeys(columns, data),
      foreignKeys: this.detectForeignKeys(columns, data),
      indexes: this.detectIndexes(columns, data),
      constraints: this.detectConstraints(columns, data),
      statistics: {
        totalRows: data.length,
        totalColumns: columns.length,
        totalSize: JSON.stringify(data).length,
        lastAnalyzed: new Date(),
      },
    };
  }

  private calculateColumnStatistics(data: any[]): ColumnStatistics {
    const nonNullData = data.filter(
      (value) => value !== null && value !== undefined
    );
    const count = data.length;
    const nullCount = count - nonNullData.length;
    const uniqueCount = new Set(nonNullData).size;

    let min: number = 0,
      max: number = 0,
      mean: number = 0,
      median: number = 0,
      mode: string | number = 0,
      standardDeviation: number = 0;
    const distribution: Record<string, number> = {};

    if (nonNullData.length > 0) {
      // Calculate distribution
      for (const value of nonNullData) {
        const key = String(value);
        distribution[key] = (distribution[key] || 0) + 1;
      }

      // Find mode
      mode = Object.entries(distribution).reduce((a, b) =>
        distribution[a[0]] > distribution[b[0]] ? a : b
      )[0];

      // For numeric data, calculate additional statistics
      const numericData = nonNullData
        .filter((value) => !isNaN(Number(value)))
        .map(Number);
      if (numericData.length > 0) {
        numericData.sort((a, b) => a - b);
        min = numericData[0];
        max = numericData[numericData.length - 1];
        mean =
          numericData.reduce((sum, val) => sum + val, 0) / numericData.length;
        median = numericData[Math.floor(numericData.length / 2)];

        // Standard deviation
        const variance =
          numericData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          numericData.length;
        standardDeviation = Math.sqrt(variance);
      }
    }

    return {
      count,
      nullCount,
      uniqueCount,
      min,
      max,
      mean,
      median,
      mode,
      standardDeviation,
      distribution,
    };
  }

  private inferColumnType(data: any[]): string {
    const nonNullData = data.filter(
      (value) => value !== null && value !== undefined
    );
    if (nonNullData.length === 0) return "unknown";

    const sample = nonNullData[0];
    const sampleType = typeof sample;

    if (sampleType === "number") {
      return Number.isInteger(sample) ? "integer" : "float";
    } else if (sampleType === "boolean") {
      return "boolean";
    } else if (sampleType === "string") {
      // Check if it's a date
      if (!isNaN(Date.parse(sample))) {
        return "date";
      }
      // Check if it's an email
      if (sample.includes("@") && sample.includes(".")) {
        return "email";
      }
      // Check if it's a URL
      if (sample.startsWith("http://") || sample.startsWith("https://")) {
        return "url";
      }
      return "string";
    } else if (sample instanceof Date) {
      return "datetime";
    }

    return "unknown";
  }

  private getColumnExamples(data: any[]): any[] {
    const nonNullData = data.filter(
      (value) => value !== null && value !== undefined
    );
    const uniqueValues = [...new Set(nonNullData)];
    return uniqueValues.slice(0, 5);
  }

  private detectPrimaryKeys(columns: SchemaColumn[], data: any[]): string[] {
    // Simple heuristic: columns with unique values and no nulls
    return columns
      .filter(
        (col) =>
          col.statistics.uniqueCount === data.length &&
          col.statistics.nullCount === 0
      )
      .map((col) => col.name);
  }

  private detectForeignKeys(
    columns: SchemaColumn[],
    data: any[]
  ): ForeignKey[] {
    // Placeholder implementation
    // In a real implementation, this would analyze data patterns and relationships
    return [];
  }

  private detectIndexes(columns: SchemaColumn[], data: any[]): Index[] {
    const indexes: Index[] = [];

    // Primary key indexes
    const primaryKeys = this.detectPrimaryKeys(columns, data);
    for (const pk of primaryKeys) {
      indexes.push({
        name: `pk_${pk}`,
        columns: [pk],
        type: "primary",
        isUnique: true,
      });
    }

    // Unique indexes
    for (const col of columns) {
      if (
        col.statistics.uniqueCount === data.length &&
        col.statistics.nullCount === 0
      ) {
        indexes.push({
          name: `uk_${col.name}`,
          columns: [col.name],
          type: "unique",
          isUnique: true,
        });
      }
    }

    return indexes;
  }

  private detectConstraints(
    columns: SchemaColumn[],
    data: any[]
  ): Constraint[] {
    const constraints: Constraint[] = [];

    // Not null constraints
    for (const col of columns) {
      if (col.statistics.nullCount === 0) {
        constraints.push({
          name: `nn_${col.name}`,
          type: "not_null",
          columns: [col.name],
        });
      }
    }

    return constraints;
  }

  // Quality Management
  async updateQuality(
    entryId: string,
    quality: Partial<DataQuality>
  ): Promise<boolean> {
    const entry = this.catalog.get(entryId);
    if (!entry) return false;

    const updatedQuality = {
      ...entry.quality,
      ...quality,
    };

    return this.updateEntry(entryId, { quality: updatedQuality });
  }

  // Access Management
  async updateAccess(
    entryId: string,
    access: Partial<DataAccess>
  ): Promise<boolean> {
    const entry = this.catalog.get(entryId);
    if (!entry) return false;

    const updatedAccess = {
      ...entry.access,
      ...access,
      lastAudit: new Date(),
    };

    return this.updateEntry(entryId, { access: updatedAccess });
  }

  // Query Methods
  getEntry(entryId: string): DataCatalogEntry | undefined {
    return this.catalog.get(entryId);
  }

  getAllEntries(): DataCatalogEntry[] {
    return Array.from(this.catalog.values());
  }

  getEntriesByType(type: DataCatalogEntry["type"]): DataCatalogEntry[] {
    return Array.from(this.catalog.values()).filter(
      (entry) => entry.type === type
    );
  }

  getEntriesByOwner(owner: string): DataCatalogEntry[] {
    return Array.from(this.catalog.values()).filter(
      (entry) => entry.owner === owner
    );
  }

  getEntriesByDataSource(dataSourceId: string): DataCatalogEntry[] {
    return Array.from(this.catalog.values()).filter(
      (entry) => entry.dataSourceId === dataSourceId
    );
  }

  // Search Index Management
  private updateSearchIndex(entryId: string, entry: DataCatalogEntry): void {
    const searchableTerms = [
      entry.name,
      entry.description || "",
      ...entry.tags,
      ...entry.schema.columns.map((c) => c.name),
      entry.metadata.business.domain,
      entry.metadata.business.category,
      entry.metadata.business.purpose,
    ].filter((term) => term && term.trim().length > 0);

    this.searchIndex.set(entryId, searchableTerms);
  }

  // Export/Import
  async exportCatalog(): Promise<{
    entries: DataCatalogEntry[];
    searchIndex: Record<string, string[]>;
  }> {
    return {
      entries: Array.from(this.catalog.values()),
      searchIndex: Object.fromEntries(this.searchIndex),
    };
  }

  async importCatalog(data: {
    entries: DataCatalogEntry[];
    searchIndex: Record<string, string[]>;
  }): Promise<void> {
    // Clear existing data
    this.catalog.clear();
    this.searchIndex.clear();

    // Import entries
    for (const entry of data.entries) {
      this.catalog.set(entry.id, entry);
    }

    // Import search index
    for (const [entryId, terms] of Object.entries(data.searchIndex)) {
      this.searchIndex.set(entryId, terms);
    }

    clientLogger.info("Data catalog imported", "system", {
      entries: data.entries.length,
      searchIndexEntries: Object.keys(data.searchIndex).length,
    });
  }
}

export interface SearchFilters {
  type?: DataCatalogEntry["type"];
  owner?: string;
  tags?: string[];
  dataSourceId?: string;
  minQualityScore?: number;
}
