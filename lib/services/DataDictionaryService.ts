/**
 * Data Dictionary Service
 * 
 * Manages data dictionary entries, field definitions, and relationships
 */

import {
  DataDictionaryEntry,
  FieldDefinition,
  DataRelationship,
  DictionarySearchCriteria,
  DictionarySearchResult,
  DictionaryExport,
  BulkDictionaryOperation,
  BulkOperationResult,
  FieldStatistics,
  DataQualityMetrics,
  LineageInfo,
} from "../../types/dataDictionary";
import { DataProvider, Snapshot } from "../../types";

export class DataDictionaryService {
  private entries: Map<string, DataDictionaryEntry> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // CRUD Operations

  async createEntry(
    entry: Omit<DataDictionaryEntry, "id" | "createdAt" | "updatedAt">
  ): Promise<DataDictionaryEntry> {
    const newEntry: DataDictionaryEntry = {
      ...entry,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.entries.set(newEntry.id, newEntry);
    await this.saveToStorage();

    return newEntry;
  }

  async getEntry(id: string): Promise<DataDictionaryEntry | null> {
    return this.entries.get(id) || null;
  }

  async getEntryByDataSource(dataSourceId: string): Promise<DataDictionaryEntry | null> {
    for (const entry of this.entries.values()) {
      if (entry.dataSourceId === dataSourceId) {
        return entry;
      }
    }
    return null;
  }

  async updateEntry(
    id: string,
    updates: Partial<DataDictionaryEntry>
  ): Promise<DataDictionaryEntry | null> {
    const entry = this.entries.get(id);
    if (!entry) return null;

    const updatedEntry: DataDictionaryEntry = {
      ...entry,
      ...updates,
      id: entry.id, // Preserve ID
      createdAt: entry.createdAt, // Preserve creation date
      updatedAt: new Date(),
    };

    this.entries.set(id, updatedEntry);
    await this.saveToStorage();

    return updatedEntry;
  }

  async deleteEntry(id: string): Promise<boolean> {
    const deleted = this.entries.delete(id);
    if (deleted) {
      await this.saveToStorage();
    }
    return deleted;
  }

  async listEntries(projectId?: string): Promise<DataDictionaryEntry[]> {
    const entries = Array.from(this.entries.values());
    if (projectId) {
      return entries.filter((entry) => entry.projectId === projectId);
    }
    return entries;
  }

  // Field Operations

  async addField(entryId: string, field: Omit<FieldDefinition, "id">): Promise<FieldDefinition | null> {
    const entry = this.entries.get(entryId);
    if (!entry) return null;

    const newField: FieldDefinition = {
      ...field,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    entry.fields.push(newField);
    entry.updatedAt = new Date();

    this.entries.set(entryId, entry);
    await this.saveToStorage();

    return newField;
  }

  async updateField(
    entryId: string,
    fieldId: string,
    updates: Partial<FieldDefinition>
  ): Promise<FieldDefinition | null> {
    const entry = this.entries.get(entryId);
    if (!entry) return null;

    const fieldIndex = entry.fields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) return null;

    entry.fields[fieldIndex] = {
      ...entry.fields[fieldIndex],
      ...updates,
      id: fieldId, // Preserve ID
      updatedAt: new Date(),
    };

    entry.updatedAt = new Date();
    this.entries.set(entryId, entry);
    await this.saveToStorage();

    return entry.fields[fieldIndex];
  }

  async deleteField(entryId: string, fieldId: string): Promise<boolean> {
    const entry = this.entries.get(entryId);
    if (!entry) return false;

    const initialLength = entry.fields.length;
    entry.fields = entry.fields.filter((f) => f.id !== fieldId);

    if (entry.fields.length < initialLength) {
      entry.updatedAt = new Date();
      this.entries.set(entryId, entry);
      await this.saveToStorage();
      return true;
    }

    return false;
  }

  // Relationship Operations

  async addRelationship(
    entryId: string,
    relationship: Omit<DataRelationship, "id" | "createdAt">
  ): Promise<DataRelationship | null> {
    const entry = this.entries.get(entryId);
    if (!entry) return null;

    const newRelationship: DataRelationship = {
      ...relationship,
      id: this.generateId(),
      createdAt: new Date(),
    };

    entry.relationships.push(newRelationship);
    entry.updatedAt = new Date();

    this.entries.set(entryId, entry);
    await this.saveToStorage();

    return newRelationship;
  }

  async deleteRelationship(entryId: string, relationshipId: string): Promise<boolean> {
    const entry = this.entries.get(entryId);
    if (!entry) return false;

    const initialLength = entry.relationships.length;
    entry.relationships = entry.relationships.filter((r) => r.id !== relationshipId);

    if (entry.relationships.length < initialLength) {
      entry.updatedAt = new Date();
      this.entries.set(entryId, entry);
      await this.saveToStorage();
      return true;
    }

    return false;
  }

  async getRelatedEntries(entryId: string): Promise<DataDictionaryEntry[]> {
    const entry = this.entries.get(entryId);
    if (!entry) return [];

    const relatedIds = new Set<string>();
    entry.relationships.forEach((rel) => {
      relatedIds.add(rel.targetDataSourceId);
    });

    const relatedEntries: DataDictionaryEntry[] = [];
    for (const id of relatedIds) {
      const relatedEntry = await this.getEntryByDataSource(id);
      if (relatedEntry) {
        relatedEntries.push(relatedEntry);
      }
    }

    return relatedEntries;
  }

  // Search and Filter

  async search(criteria: DictionarySearchCriteria): Promise<DictionarySearchResult> {
    let results = Array.from(this.entries.values());

    // Apply filters
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(
        (entry) =>
          entry.businessName.toLowerCase().includes(query) ||
          entry.technicalName.toLowerCase().includes(query) ||
          entry.description?.toLowerCase().includes(query) ||
          entry.fields.some((f) => 
            f.name.toLowerCase().includes(query) || 
            f.description?.toLowerCase().includes(query)
          )
      );
    }

    if (criteria.dataSourceIds && criteria.dataSourceIds.length > 0) {
      results = results.filter((entry) =>
        criteria.dataSourceIds!.includes(entry.dataSourceId)
      );
    }

    if (criteria.categories && criteria.categories.length > 0) {
      results = results.filter((entry) =>
        entry.category && criteria.categories!.includes(entry.category)
      );
    }

    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter((entry) =>
        entry.tags.some((tag) => criteria.tags!.includes(tag))
      );
    }

    if (criteria.domains && criteria.domains.length > 0) {
      results = results.filter((entry) =>
        entry.domain && criteria.domains!.includes(entry.domain)
      );
    }

    if (criteria.owner) {
      results = results.filter((entry) => entry.owner === criteria.owner);
    }

    if (criteria.hasRelationships !== undefined) {
      results = results.filter((entry) =>
        criteria.hasRelationships
          ? entry.relationships.length > 0
          : entry.relationships.length === 0
      );
    }

    if (criteria.qualityScoreMin !== undefined) {
      results = results.filter(
        (entry) =>
          entry.dataQuality?.overallScore !== undefined &&
          entry.dataQuality.overallScore >= criteria.qualityScoreMin!
      );
    }

    if (criteria.qualityScoreMax !== undefined) {
      results = results.filter(
        (entry) =>
          entry.dataQuality?.overallScore !== undefined &&
          entry.dataQuality.overallScore <= criteria.qualityScoreMax!
      );
    }

    // Calculate facets
    const facets = this.calculateFacets(results);

    return {
      entries: results,
      totalCount: results.length,
      facets,
    };
  }

  private calculateFacets(entries: DataDictionaryEntry[]) {
    const categoryMap = new Map<string, number>();
    const tagMap = new Map<string, number>();
    const domainMap = new Map<string, number>();
    const ownerMap = new Map<string, number>();

    entries.forEach((entry) => {
      if (entry.category) {
        categoryMap.set(entry.category, (categoryMap.get(entry.category) || 0) + 1);
      }

      entry.tags.forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });

      if (entry.domain) {
        domainMap.set(entry.domain, (domainMap.get(entry.domain) || 0) + 1);
      }

      if (entry.owner) {
        ownerMap.set(entry.owner, (ownerMap.get(entry.owner) || 0) + 1);
      }
    });

    return {
      categories: Array.from(categoryMap.entries()).map(([value, count]) => ({
        value,
        count,
      })),
      tags: Array.from(tagMap.entries()).map(([value, count]) => ({ value, count })),
      domains: Array.from(domainMap.entries()).map(([value, count]) => ({ value, count })),
      owners: Array.from(ownerMap.entries()).map(([value, count]) => ({ value, count })),
    };
  }

  // Auto-generation from Data Sources

  async generateFromDataSource(
    dataSource: DataProvider,
    snapshot?: Snapshot
  ): Promise<DataDictionaryEntry> {
    // Check if entry already exists
    const existingEntry = await this.getEntryByDataSource(dataSource.id);
    if (existingEntry) {
      return existingEntry;
    }

    // Generate fields from schema or snapshot data
    const fields: FieldDefinition[] = [];
    
    if (snapshot?.schema?.columns) {
      snapshot.schema.columns.forEach((column, index) => {
        fields.push({
          id: this.generateId(),
          name: column.name,
          displayName: this.formatDisplayName(column.name),
          description: `Auto-generated field from ${dataSource.name}`,
          dataType: column.type,
          technicalType: column.type.toUpperCase(),
          nullable: column.nullable,
          isPrimaryKey: snapshot.schema?.primaryKeys?.includes(column.name) || false,
          isForeignKey: false,
          isUnique: column.unique || false,
          isIndexed: false,
          tags: [],
        });
      });
    } else if (snapshot?.data && snapshot.data.length > 0) {
      // Infer fields from data
      const sampleRecord = snapshot.data[0];
      Object.keys(sampleRecord).forEach((key) => {
        const value = sampleRecord[key];
        const inferredType = this.inferDataType(value);

        fields.push({
          id: this.generateId(),
          name: key,
          displayName: this.formatDisplayName(key),
          description: `Auto-generated field from ${dataSource.name}`,
          dataType: inferredType,
          nullable: true,
          isPrimaryKey: key.toLowerCase() === "id",
          isForeignKey: false,
          isUnique: false,
          isIndexed: false,
          tags: [],
        });
      });
    }

    // Calculate statistics if we have data
    if (snapshot?.data && fields.length > 0) {
      fields.forEach((field) => {
        field.statistics = this.calculateFieldStatistics(field.name, snapshot.data);
      });
    }

    const entry: Omit<DataDictionaryEntry, "id" | "createdAt" | "updatedAt"> = {
      projectId: dataSource.projectId,
      dataSourceId: dataSource.id,
      businessName: dataSource.name,
      technicalName: dataSource.name,
      description: `Auto-generated data dictionary entry for ${dataSource.name}`,
      category: this.categorizeDataSource(dataSource.type),
      tags: [dataSource.type, "auto-generated"],
      fields,
      relationships: [],
      dataQuality: snapshot ? this.assessDataQuality(snapshot.data, fields) : undefined,
    };

    return this.createEntry(entry);
  }

  private inferDataType(value: any): FieldDefinition["dataType"] {
    if (value === null || value === undefined) return "unknown";
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return "datetime";
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
      if (/^[a-f0-9-]{36}$/i.test(value)) return "uuid";
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
      if (/^https?:\/\//.test(value)) return "url";
      return "string";
    }
    if (typeof value === "number") {
      return Number.isInteger(value) ? "integer" : "float";
    }
    if (typeof value === "boolean") return "boolean";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "json";
    return "unknown";
  }

  private formatDisplayName(name: string): string {
    return name
      .replace(/([A-Z])/g, " $1")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  }

  private categorizeDataSource(type: string): string {
    const categoryMap: Record<string, string> = {
      mysql: "Database",
      postgres: "Database",
      mssql: "Database",
      sqlite: "Database",
      odbc: "Database",
      csv: "File",
      json: "File",
      api_script: "API",
      javascript: "Custom",
    };
    return categoryMap[type] || "Other";
  }

  private calculateFieldStatistics(fieldName: string, data: any[]): FieldStatistics {
    const values = data.map((record) => record[fieldName]).filter((v) => v !== null && v !== undefined);
    const totalCount = data.length;
    const nullCount = totalCount - values.length;

    const uniqueValues = new Set(values);
    const distinctCount = uniqueValues.size;

    // Calculate top values
    const valueCounts = new Map<any, number>();
    values.forEach((v) => {
      valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
    });

    const topValues = Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({
        value,
        count,
        percentage: (count / values.length) * 100,
      }));

    // Calculate numeric statistics if applicable
    const numericValues = values.filter((v) => typeof v === "number");
    let avgValue: number | undefined;
    let minValue: any;
    let maxValue: any;

    if (numericValues.length > 0) {
      avgValue = numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length;
      minValue = Math.min(...numericValues);
      maxValue = Math.max(...numericValues);
    } else if (values.length > 0) {
      minValue = values[0];
      maxValue = values[values.length - 1];
    }

    return {
      distinctCount,
      minValue,
      maxValue,
      avgValue,
      nullCount,
      totalCount,
      topValues,
      lastCalculated: new Date(),
    };
  }

  private assessDataQuality(data: any[], fields: FieldDefinition[]): DataQualityMetrics {
    if (!data || data.length === 0) {
      return {
        overallScore: 0,
        completeness: 0,
        lastAssessed: new Date(),
      };
    }

    let totalCompleteness = 0;
    let totalUniqueness = 0;
    const fieldCount = fields.length;

    fields.forEach((field) => {
      const values = data.map((record) => record[field.name]);
      const nonNullValues = values.filter((v) => v !== null && v !== undefined);
      const completeness = (nonNullValues.length / data.length) * 100;
      totalCompleteness += completeness;

      const uniqueValues = new Set(nonNullValues);
      const uniqueness = (uniqueValues.size / nonNullValues.length) * 100 || 0;
      totalUniqueness += uniqueness;
    });

    const avgCompleteness = totalCompleteness / fieldCount;
    const avgUniqueness = totalUniqueness / fieldCount;

    // Simple overall score calculation
    const overallScore = (avgCompleteness * 0.6 + avgUniqueness * 0.4);

    return {
      overallScore: Math.round(overallScore),
      completeness: Math.round(avgCompleteness),
      uniqueness: Math.round(avgUniqueness),
      lastAssessed: new Date(),
      issues: [],
    };
  }

  // Bulk Operations

  async bulkOperation(operation: BulkDictionaryOperation): Promise<BulkOperationResult> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const id of operation.entryIds) {
      try {
        switch (operation.operation) {
          case "delete":
            await this.deleteEntry(id);
            successful.push(id);
            break;

          case "update":
            if (operation.data) {
              await this.updateEntry(id, operation.data);
              successful.push(id);
            }
            break;

          case "tag":
            if (operation.data?.tags) {
              const entry = await this.getEntry(id);
              if (entry) {
                const updatedTags = [...new Set([...entry.tags, ...operation.data.tags])];
                await this.updateEntry(id, { tags: updatedTags });
                successful.push(id);
              }
            }
            break;

          case "categorize":
            if (operation.data?.category) {
              await this.updateEntry(id, { category: operation.data.category });
              successful.push(id);
            }
            break;
        }
      } catch (error) {
        failed.push({
          id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      successful,
      failed,
      totalProcessed: operation.entryIds.length,
      totalSuccessful: successful.length,
      totalFailed: failed.length,
    };
  }

  // Export/Import

  async exportDictionary(projectId: string): Promise<DictionaryExport> {
    const entries = await this.listEntries(projectId);

    return {
      version: "1.0",
      exportedAt: new Date(),
      projectId,
      entries,
      metadata: {
        totalEntries: entries.length,
        totalFields: entries.reduce((sum, e) => sum + e.fields.length, 0),
        totalRelationships: entries.reduce((sum, e) => sum + e.relationships.length, 0),
      },
    };
  }

  async importDictionary(data: DictionaryExport): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of data.entries) {
      try {
        // Check if entry already exists
        const existing = await this.getEntryByDataSource(entry.dataSourceId);
        if (existing) {
          skipped++;
          continue;
        }

        await this.createEntry({
          ...entry,
          projectId: data.projectId,
        } as any);
        imported++;
      } catch (error) {
        errors.push(
          `Failed to import ${entry.businessName}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return { imported, skipped, errors };
  }

  // Storage

  private async saveToStorage(): Promise<void> {
    if (typeof window !== "undefined") {
      try {
        const data = JSON.stringify(Array.from(this.entries.entries()));
        localStorage.setItem("dataDictionary", data);
      } catch (error) {
        console.error("Failed to save data dictionary to storage:", error);
      }
    }
  }

  private loadFromStorage(): void {
    if (typeof window !== "undefined") {
      try {
        const data = localStorage.getItem("dataDictionary");
        if (data) {
          const entries = JSON.parse(data);
          this.entries = new Map(entries);
        }
      } catch (error) {
        console.error("Failed to load data dictionary from storage:", error);
      }
    }
  }

  private generateId(): string {
    return `dict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Analytics

  async getStatistics(projectId?: string): Promise<{
    totalEntries: number;
    totalFields: number;
    totalRelationships: number;
    entriesByCategory: Record<string, number>;
    entriesByDomain: Record<string, number>;
    avgQualityScore: number;
    entriesWithIssues: number;
  }> {
    const entries = await this.listEntries(projectId);

    const entriesByCategory: Record<string, number> = {};
    const entriesByDomain: Record<string, number> = {};
    let totalQualityScore = 0;
    let entriesWithQualityScore = 0;
    let entriesWithIssues = 0;

    entries.forEach((entry) => {
      if (entry.category) {
        entriesByCategory[entry.category] = (entriesByCategory[entry.category] || 0) + 1;
      }
      if (entry.domain) {
        entriesByDomain[entry.domain] = (entriesByDomain[entry.domain] || 0) + 1;
      }
      if (entry.dataQuality?.overallScore !== undefined) {
        totalQualityScore += entry.dataQuality.overallScore;
        entriesWithQualityScore++;
      }
      if (entry.dataQuality?.issues && entry.dataQuality.issues.length > 0) {
        entriesWithIssues++;
      }
    });

    return {
      totalEntries: entries.length,
      totalFields: entries.reduce((sum, e) => sum + e.fields.length, 0),
      totalRelationships: entries.reduce((sum, e) => sum + e.relationships.length, 0),
      entriesByCategory,
      entriesByDomain,
      avgQualityScore:
        entriesWithQualityScore > 0 ? totalQualityScore / entriesWithQualityScore : 0,
      entriesWithIssues,
    };
  }
}

// Singleton instance
export const dataDictionaryService = new DataDictionaryService();

