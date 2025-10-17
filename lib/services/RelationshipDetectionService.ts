/**
 * Relationship Detection Service
 * 
 * Automatically discovers relationships between data sources based on:
 * - Column name matching (exact, fuzzy, and pattern-based)
 * - Data type compatibility
 * - Foreign key patterns (id, _id, Id suffixes)
 * - Value distribution analysis
 * - Uniqueness and cardinality patterns
 */

import { DataDictionaryEntry, FieldDefinition, DataRelationship, RelationshipType } from "../../types/dataDictionary";

export interface RelationshipSuggestion {
  id: string;
  confidence: number; // 0-100
  sourceEntryId: string;
  sourceFieldId: string;
  targetEntryId: string;
  targetFieldId: string;
  relationshipType: RelationshipType;
  reasoning: string[];
  evidence: {
    nameMatch?: number; // 0-100
    typeMatch?: boolean;
    cardinalityMatch?: string;
    valueOverlap?: number; // percentage
  };
  autoAcceptThreshold: number; // confidence threshold for auto-accept (default 90)
}

export interface DetectionOptions {
  minConfidence?: number; // Minimum confidence to suggest (default 50)
  includeWeak?: boolean; // Include weak matches (default true)
  fuzzyMatching?: boolean; // Enable fuzzy name matching (default true)
  checkValues?: boolean; // Analyze actual values (slower, default false)
  maxSuggestions?: number; // Max suggestions per field (default 5)
}

export class RelationshipDetectionService {
  private static instance: RelationshipDetectionService;

  static getInstance(): RelationshipDetectionService {
    if (!RelationshipDetectionService.instance) {
      RelationshipDetectionService.instance = new RelationshipDetectionService();
    }
    return RelationshipDetectionService.instance;
  }

  /**
   * Detect relationships for a single entry
   */
  async detectRelationshipsForEntry(
    entry: DataDictionaryEntry,
    allEntries: DataDictionaryEntry[],
    options: DetectionOptions = {}
  ): Promise<RelationshipSuggestion[]> {
    const {
      minConfidence = 50,
      includeWeak = true,
      fuzzyMatching = true,
      checkValues = false,
      maxSuggestions = 5,
    } = options;

    const suggestions: RelationshipSuggestion[] = [];
    const otherEntries = allEntries.filter((e) => e.id !== entry.id);

    // Check each field in the entry
    for (const field of entry.fields) {
      // Skip fields that are not good candidates for relationships
      if (this.shouldSkipField(field)) {
        continue;
      }

      // Check against all fields in other entries
      for (const otherEntry of otherEntries) {
        for (const otherField of otherEntry.fields) {
          const suggestion = this.detectRelationship(
            entry,
            field,
            otherEntry,
            otherField,
            { fuzzyMatching, checkValues }
          );

          if (suggestion && suggestion.confidence >= minConfidence) {
            if (includeWeak || suggestion.confidence >= 70) {
              suggestions.push(suggestion);
            }
          }
        }
      }
    }

    // Sort by confidence and limit
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxSuggestions * entry.fields.length);
  }

  /**
   * Detect relationships across all entries
   */
  async detectAllRelationships(
    entries: DataDictionaryEntry[],
    options: DetectionOptions = {}
  ): Promise<Map<string, RelationshipSuggestion[]>> {
    const allSuggestions = new Map<string, RelationshipSuggestion[]>();

    for (const entry of entries) {
      const suggestions = await this.detectRelationshipsForEntry(entry, entries, options);
      if (suggestions.length > 0) {
        allSuggestions.set(entry.id, suggestions);
      }
    }

    return allSuggestions;
  }

  /**
   * Core detection logic for a pair of fields
   */
  private detectRelationship(
    sourceEntry: DataDictionaryEntry,
    sourceField: FieldDefinition,
    targetEntry: DataDictionaryEntry,
    targetField: FieldDefinition,
    options: { fuzzyMatching: boolean; checkValues: boolean }
  ): RelationshipSuggestion | null {
    const reasoning: string[] = [];
    const evidence: RelationshipSuggestion["evidence"] = {};
    let confidence = 0;

    // 1. Name matching (40 points max)
    const nameMatch = this.calculateNameMatch(sourceField.name, targetField.name, options.fuzzyMatching);
    if (nameMatch > 0) {
      evidence.nameMatch = nameMatch;
      confidence += nameMatch * 0.4; // Up to 40 points
      if (nameMatch > 80) {
        reasoning.push(`Field names are very similar: "${sourceField.name}" ↔ "${targetField.name}"`);
      } else if (nameMatch > 50) {
        reasoning.push(`Field names match partially: "${sourceField.name}" ↔ "${targetField.name}"`);
      }
    }

    // 2. Type compatibility (20 points)
    const typeMatch = this.areTypesCompatible(sourceField.dataType, targetField.dataType);
    evidence.typeMatch = typeMatch;
    if (typeMatch) {
      confidence += 20;
      reasoning.push(`Compatible data types: ${sourceField.dataType} ↔ ${targetField.dataType}`);
    } else {
      // Type mismatch is a deal-breaker for most relationships
      return null;
    }

    // 3. Foreign key pattern detection (20 points)
    const fkPattern = this.detectForeignKeyPattern(sourceField.name, targetField.name);
    if (fkPattern) {
      confidence += 20;
      reasoning.push(`Foreign key pattern detected: ${fkPattern}`);
    }

    // 4. Primary/Unique key patterns (20 points)
    if (targetField.isPrimaryKey || targetField.isUnique) {
      confidence += 15;
      reasoning.push(`Target field is ${targetField.isPrimaryKey ? "primary key" : "unique"}`);
    }
    if (sourceField.isForeignKey) {
      confidence += 5;
      reasoning.push("Source field is marked as foreign key");
    }

    // 5. Cardinality hints from statistics (bonus points)
    if (sourceField.statistics && targetField.statistics) {
      const cardinalityMatch = this.detectCardinalityPattern(sourceField, targetField);
      if (cardinalityMatch) {
        evidence.cardinalityMatch = cardinalityMatch;
        confidence += 10;
        reasoning.push(`Cardinality suggests ${cardinalityMatch} relationship`);
      }
    }

    // Must have at least some confidence to suggest
    if (confidence < 30) {
      return null;
    }

    // Determine relationship type
    const relationshipType = this.determineRelationshipType(sourceField, targetField);

    return {
      id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      confidence: Math.min(confidence, 100),
      sourceEntryId: sourceEntry.id,
      sourceFieldId: sourceField.id,
      targetEntryId: targetEntry.id,
      targetFieldId: targetField.id,
      relationshipType,
      reasoning,
      evidence,
      autoAcceptThreshold: 90,
    };
  }

  /**
   * Calculate name match score (0-100)
   */
  private calculateNameMatch(name1: string, name2: string, fuzzy: boolean): number {
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();

    // Exact match
    if (n1 === n2) {
      return 100;
    }

    // Common FK patterns: table_id matches table.id
    const fkPatterns = [
      { source: n1, target: n2.replace(/_id$|_fk$/, "") },
      { source: n1.replace(/_id$|_fk$/, ""), target: n2 },
      { source: n1, target: n2.replace(/^fk_/, "") },
      { source: n1.replace(/^fk_/, ""), target: n2 },
    ];

    for (const pattern of fkPatterns) {
      if (pattern.source === pattern.target) {
        return 85;
      }
    }

    // One contains the other
    if (n1.includes(n2) || n2.includes(n1)) {
      return 70;
    }

    // Fuzzy matching (Levenshtein distance)
    if (fuzzy) {
      const distance = this.levenshteinDistance(n1, n2);
      const maxLen = Math.max(n1.length, n2.length);
      const similarity = ((maxLen - distance) / maxLen) * 100;
      return Math.max(0, similarity);
    }

    return 0;
  }

  /**
   * Check if data types are compatible for relationships
   */
  private areTypesCompatible(type1: string, type2: string): boolean {
    const t1 = type1.toLowerCase();
    const t2 = type2.toLowerCase();

    // Exact match
    if (t1 === t2) {
      return true;
    }

    // Numeric types are compatible with each other
    const numericTypes = ["integer", "number", "float", "decimal"];
    if (numericTypes.includes(t1) && numericTypes.includes(t2)) {
      return true;
    }

    // String types are compatible
    const stringTypes = ["string", "uuid", "email", "url"];
    if (stringTypes.includes(t1) && stringTypes.includes(t2)) {
      return true;
    }

    // Date types are compatible
    const dateTypes = ["date", "datetime", "timestamp", "time"];
    if (dateTypes.includes(t1) && dateTypes.includes(t2)) {
      return true;
    }

    return false;
  }

  /**
   * Detect foreign key patterns in field names
   */
  private detectForeignKeyPattern(sourceName: string, targetName: string): string | null {
    const source = sourceName.toLowerCase();
    const target = targetName.toLowerCase();

    // Pattern: customer_id → id (in customers table)
    if (source.endsWith("_id") && target === "id") {
      return "table_id → id";
    }

    // Pattern: customerId → id
    if (source.endsWith("id") && target === "id") {
      return "tableId → id";
    }

    // Pattern: fk_customer → id
    if (source.startsWith("fk_") && target === "id") {
      return "fk_table → id";
    }

    // Pattern: customer_id → customer_id (same name in both tables)
    if (source === target && (source.endsWith("_id") || source.endsWith("id"))) {
      return "matching key field";
    }

    return null;
  }

  /**
   * Detect cardinality pattern from statistics
   */
  private detectCardinalityPattern(
    sourceField: FieldDefinition,
    targetField: FieldDefinition
  ): string | null {
    if (!sourceField.statistics || !targetField.statistics) {
      return null;
    }

    const sourceDistinct = sourceField.statistics.distinctCount || 0;
    const sourceTotal = sourceField.statistics.totalCount || 0;
    const targetDistinct = targetField.statistics.distinctCount || 0;
    const targetTotal = targetField.statistics.totalCount || 0;

    if (sourceTotal === 0 || targetTotal === 0) {
      return null;
    }

    const sourceUniqueness = sourceDistinct / sourceTotal;
    const targetUniqueness = targetDistinct / targetTotal;

    // One-to-One: Both sides highly unique
    if (sourceUniqueness > 0.95 && targetUniqueness > 0.95) {
      return "one-to-one";
    }

    // One-to-Many: Target unique, source not
    if (targetUniqueness > 0.95 && sourceUniqueness < 0.9) {
      return "one-to-many";
    }

    // Many-to-One: Source unique, target not
    if (sourceUniqueness > 0.95 && targetUniqueness < 0.9) {
      return "many-to-one";
    }

    // Many-to-Many: Neither side very unique
    if (sourceUniqueness < 0.8 && targetUniqueness < 0.8) {
      return "many-to-many";
    }

    return null;
  }

  /**
   * Determine relationship type based on field properties
   */
  private determineRelationshipType(
    sourceField: FieldDefinition,
    targetField: FieldDefinition
  ): RelationshipType {
    // If target is primary key or unique, likely one-to-many or one-to-one
    if (targetField.isPrimaryKey || targetField.isUnique) {
      if (sourceField.isUnique) {
        return "one_to_one";
      }
      return "one_to_many";
    }

    // If source is foreign key
    if (sourceField.isForeignKey) {
      return "one_to_many";
    }

    // Use statistics if available
    if (sourceField.statistics && targetField.statistics) {
      const pattern = this.detectCardinalityPattern(sourceField, targetField);
      if (pattern === "one-to-one") return "one_to_one";
      if (pattern === "one-to-many") return "one_to_many";
      if (pattern === "many-to-one") return "many_to_one";
      if (pattern === "many-to-many") return "many_to_many";
    }

    // Default to one-to-many (most common)
    return "one_to_many";
  }

  /**
   * Skip fields that are poor candidates for relationships
   */
  private shouldSkipField(field: FieldDefinition): boolean {
    const name = field.name.toLowerCase();

    // Skip common non-relational fields
    const skipPatterns = [
      "created_at",
      "createdat",
      "updated_at",
      "updatedat",
      "deleted_at",
      "deletedat",
      "timestamp",
      "date",
      "time",
      "description",
      "notes",
      "comment",
      "status",
      "type",
      "flag",
      "is_",
      "has_",
    ];

    for (const pattern of skipPatterns) {
      if (name.includes(pattern)) {
        return true;
      }
    }

    // Skip very common generic fields
    if (["name", "title", "value", "data"].includes(name)) {
      return true;
    }

    return false;
  }

  /**
   * Calculate Levenshtein distance for fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Accept a suggestion and create actual relationship
   */
  async acceptSuggestion(
    suggestion: RelationshipSuggestion,
    entries: DataDictionaryEntry[]
  ): Promise<DataRelationship> {
    const sourceEntry = entries.find((e) => e.id === suggestion.sourceEntryId);
    const targetEntry = entries.find((e) => e.id === suggestion.targetEntryId);

    if (!sourceEntry || !targetEntry) {
      throw new Error("Entry not found");
    }

    const sourceField = sourceEntry.fields.find((f) => f.id === suggestion.sourceFieldId);
    const targetField = targetEntry.fields.find((f) => f.id === suggestion.targetFieldId);

    if (!sourceField || !targetField) {
      throw new Error("Field not found");
    }

    const relationship: DataRelationship = {
      id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: suggestion.relationshipType,
      sourceDataSourceId: sourceEntry.dataSourceId,
      sourceFieldId: sourceField.id,
      sourceFieldName: sourceField.name,
      targetDataSourceId: targetEntry.dataSourceId,
      targetDataSourceName: targetEntry.businessName,
      targetFieldId: targetField.id,
      targetFieldName: targetField.name,
      description: `Auto-detected: ${suggestion.reasoning.join("; ")}`,
      relationshipStrength: suggestion.confidence > 80 ? "strong" : suggestion.confidence > 60 ? "weak" : "inferred",
      isValidated: false,
      validationNotes: `Auto-accepted with ${suggestion.confidence}% confidence`,
      createdAt: new Date(),
      createdBy: "Auto-detection",
    };

    return relationship;
  }

  /**
   * Batch accept multiple suggestions
   */
  async acceptMultipleSuggestions(
    suggestions: RelationshipSuggestion[],
    entries: DataDictionaryEntry[]
  ): Promise<DataRelationship[]> {
    const relationships: DataRelationship[] = [];

    for (const suggestion of suggestions) {
      try {
        const relationship = await this.acceptSuggestion(suggestion, entries);
        relationships.push(relationship);
      } catch (error) {
        console.error(`Failed to accept suggestion ${suggestion.id}:`, error);
      }
    }

    return relationships;
  }
}

// Singleton instance
export const relationshipDetectionService = RelationshipDetectionService.getInstance();

