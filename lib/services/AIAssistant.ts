/**
 * AI Assistant (Pattern-based Intelligence)
 * 
 * Provides intelligent features using regex, fuzzy matching, and pattern detection:
 * - Auto-detect relationships between tables
 * - Suggest transformations based on data patterns
 * - Predict data quality issues
 * - Auto-map columns between datasets
 * - Detect data types and formats
 * 
 * No ML models required - uses heuristics and statistical analysis
 */

import { logger } from '../utils/logger';

// ==================== TYPES ====================

export interface RelationshipSuggestion {
  sourceTable: string;
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
  confidence: number; // 0-1
  relationshipType: 'one_to_one' | 'one_to_many' | 'many_to_many' | 'unknown';
  reasoning: string;
  evidence: {
    nameSimilarity: number;
    dataTypeSimilarity: number;
    valueOverlap: number;
    foreignKeyPattern: boolean;
  };
}

export interface TransformationSuggestion {
  column: string;
  currentType: string;
  suggestedType?: string;
  transformations: Array<{
    type: 'clean' | 'format' | 'extract' | 'split' | 'merge' | 'calculate';
    description: string;
    code: string;
    confidence: number;
    examples: Array<{ input: any; output: any }>;
  }>;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
  confidence: number;
  reasoning: string;
  transformation?: string;
}

export interface DataQualityIssue {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'missing_values' | 'duplicates' | 'format' | 'outliers' | 'consistency' | 'referential_integrity';
  column?: string;
  description: string;
  affectedRecords: number;
  suggestion?: string;
  autoFixAvailable: boolean;
}

export interface DataProfile {
  column: string;
  dataType: string;
  detectedFormat?: string;
  totalRecords: number;
  nullCount: number;
  uniqueCount: number;
  duplicateCount: number;
  minValue?: any;
  maxValue?: any;
  avgLength?: number;
  patterns: string[];
  examples: any[];
}

// ==================== PATTERN LIBRARIES ====================

const COLUMN_NAME_PATTERNS = {
  // Primary Keys
  primaryKey: [/^id$/i, /^.*_id$/i, /^pk_/i, /^primary_key$/i],
  
  // Foreign Keys
  foreignKey: [/^.*_id$/i, /^fk_/i, /^ref_/i],
  
  // Timestamps
  timestamp: [/created_?at/i, /updated_?at/i, /modified_?at/i, /timestamp/i, /.*_date$/i],
  
  // Email
  email: [/^email$/i, /^e?_?mail$/i, /contact_email/i, /user_email/i],
  
  // Phone
  phone: [/^phone$/i, /^tel$/i, /telephone/i, /mobile/i, /^contact$/i],
  
  // Names
  firstName: [/first_?name/i, /given_?name/i, /fname/i],
  lastName: [/last_?name/i, /surname/i, /family_?name/i, /lname/i],
  fullName: [/^name$/i, /full_?name/i, /display_?name/i],
  
  // Address
  address: [/^address$/i, /street/i, /city/i, /state/i, /zip/i, /postal/i, /country/i],
  
  // Money
  money: [/price/i, /cost/i, /amount/i, /total/i, /balance/i, /revenue/i, /salary/i],
  
  // Status
  status: [/status/i, /state/i, /condition/i],
  
  // Booleans
  boolean: [/^is_/i, /^has_/i, /^can_/i, /^should_/i, /active/i, /enabled/i],
};

const DATA_PATTERNS = {
  // Email
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone
  phone: /^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
  
  // URL
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/,
  
  // Date ISO
  dateISO: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/,
  
  // Credit Card
  creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  
  // SSN
  ssn: /^\d{3}-\d{2}-\d{4}$/,
  
  // ZIP Code
  zipCode: /^\d{5}(-\d{4})?$/,
  
  // IP Address
  ipAddress: /^(\d{1,3}\.){3}\d{1,3}$/,
  
  // UUID
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  
  // Currency
  currency: /^[\$€£¥]?[\d,]+\.?\d{0,2}$/,
};

// ==================== AI ASSISTANT ====================

export class AIAssistant {
  private static instance: AIAssistant;

  static getInstance(): AIAssistant {
    if (!AIAssistant.instance) {
      AIAssistant.instance = new AIAssistant();
    }
    return AIAssistant.instance;
  }

  // ==================== RELATIONSHIP DETECTION ====================

  /**
   * Auto-detect relationships between datasets
   */
  async detectRelationships(
    tables: Array<{ name: string; data: any[] }>
  ): Promise<RelationshipSuggestion[]> {
    const suggestions: RelationshipSuggestion[] = [];

    // Compare each pair of tables
    for (let i = 0; i < tables.length; i++) {
      for (let j = i + 1; j < tables.length; j++) {
        const sourceTable = tables[i];
        const targetTable = tables[j];

        const relationships = await this.findRelationshipsBetween(
          sourceTable.name,
          sourceTable.data,
          targetTable.name,
          targetTable.data
        );

        suggestions.push(...relationships);
      }
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Find relationships between two tables
   */
  private async findRelationshipsBetween(
    sourceName: string,
    sourceData: any[],
    targetName: string,
    targetData: any[]
  ): Promise<RelationshipSuggestion[]> {
    if (sourceData.length === 0 || targetData.length === 0) {
      return [];
    }

    const suggestions: RelationshipSuggestion[] = [];
    const sourceColumns = Object.keys(sourceData[0]);
    const targetColumns = Object.keys(targetData[0]);

    // Check each combination of columns
    for (const sourceCol of sourceColumns) {
      for (const targetCol of targetColumns) {
        const suggestion = await this.analyzeColumnRelationship(
          sourceName,
          sourceCol,
          sourceData,
          targetName,
          targetCol,
          targetData
        );

        if (suggestion && suggestion.confidence > 0.5) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  /**
   * Analyze if two columns are related
   */
  private async analyzeColumnRelationship(
    sourceName: string,
    sourceCol: string,
    sourceData: any[],
    targetName: string,
    targetCol: string,
    targetData: any[]
  ): Promise<RelationshipSuggestion | null> {
    // Calculate evidence factors
    const nameSimilarity = this.calculateNameSimilarity(sourceCol, targetCol);
    const foreignKeyPattern = this.matchesForeignKeyPattern(sourceCol, targetCol, sourceName, targetName);
    const valueOverlap = this.calculateValueOverlap(sourceData, sourceCol, targetData, targetCol);
    
    // Check data type compatibility
    const sourceType = this.inferDataType(sourceData, sourceCol);
    const targetType = this.inferDataType(targetData, targetCol);
    const dataTypeSimilarity = sourceType === targetType ? 1.0 : 0.0;

    // Calculate overall confidence
    let confidence = 0;
    let reasoning = '';

    if (foreignKeyPattern) {
      confidence += 0.4;
      reasoning += 'Foreign key naming pattern detected. ';
    }

    if (nameSimilarity > 0.7) {
      confidence += 0.3 * nameSimilarity;
      reasoning += `Column names similar (${(nameSimilarity * 100).toFixed(0)}%). `;
    }

    if (valueOverlap > 0.5) {
      confidence += 0.3 * valueOverlap;
      reasoning += `${(valueOverlap * 100).toFixed(0)}% value overlap. `;
    }

    if (dataTypeSimilarity === 1.0) {
      confidence += 0.1;
      reasoning += 'Matching data types. ';
    }

    if (confidence < 0.5) {
      return null;
    }

    // Determine relationship type based on cardinality
    const relationshipType = this.determineRelationshipType(
      sourceData,
      sourceCol,
      targetData,
      targetCol
    );

    return {
      sourceTable: sourceName,
      targetTable: targetName,
      sourceColumn: sourceCol,
      targetColumn: targetCol,
      confidence: Math.min(confidence, 1.0),
      relationshipType,
      reasoning: reasoning.trim(),
      evidence: {
        nameSimilarity,
        dataTypeSimilarity,
        valueOverlap,
        foreignKeyPattern,
      },
    };
  }

  /**
   * Calculate similarity between column names
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase().replace(/[_-]/g, '');
    const n2 = name2.toLowerCase().replace(/[_-]/g, '');

    if (n1 === n2) return 1.0;

    // Check if one contains the other
    if (n1.includes(n2) || n2.includes(n1)) {
      return 0.8;
    }

    // Levenshtein distance
    const distance = this.levenshteinDistance(n1, n2);
    const maxLen = Math.max(n1.length, n2.length);
    
    return 1 - (distance / maxLen);
  }

  /**
   * Check if columns match foreign key pattern
   */
  private matchesForeignKeyPattern(
    sourceCol: string,
    targetCol: string,
    sourceName: string,
    targetName: string
  ): boolean {
    const src = sourceCol.toLowerCase();
    const tgt = targetCol.toLowerCase();
    const srcTable = sourceName.toLowerCase();
    const tgtTable = targetName.toLowerCase();

    // Pattern: user_id in orders table → id in users table
    if (src.endsWith('_id') && tgt === 'id') {
      const prefix = src.replace(/_id$/, '');
      if (tgtTable.includes(prefix) || prefix.includes(tgtTable)) {
        return true;
      }
    }

    // Pattern: customer_id → customer_id
    if (src === tgt && src.endsWith('_id')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate value overlap between columns
   */
  private calculateValueOverlap(
    sourceData: any[],
    sourceCol: string,
    targetData: any[],
    targetCol: string
  ): number {
    const sourceValues = new Set(sourceData.map(r => r[sourceCol]).filter(v => v !== null && v !== undefined));
    const targetValues = new Set(targetData.map(r => r[targetCol]).filter(v => v !== null && v !== undefined));

    if (sourceValues.size === 0 || targetValues.size === 0) {
      return 0;
    }

    // Calculate intersection
    let intersection = 0;
    for (const value of sourceValues) {
      if (targetValues.has(value)) {
        intersection++;
      }
    }

    // Overlap = intersection / smaller set
    const smallerSize = Math.min(sourceValues.size, targetValues.size);
    return intersection / smallerSize;
  }

  /**
   * Determine relationship type (1:1, 1:N, N:N)
   */
  private determineRelationshipType(
    sourceData: any[],
    sourceCol: string,
    targetData: any[],
    targetCol: string
  ): 'one_to_one' | 'one_to_many' | 'many_to_many' | 'unknown' {
    // Check uniqueness in both columns
    const sourceValues = sourceData.map(r => r[sourceCol]);
    const targetValues = targetData.map(r => r[targetCol]);

    const sourceUnique = new Set(sourceValues).size === sourceValues.length;
    const targetUnique = new Set(targetValues).size === targetValues.length;

    if (sourceUnique && targetUnique) {
      return 'one_to_one';
    } else if (targetUnique && !sourceUnique) {
      return 'many_to_many'; // Multiple source rows map to same target
    } else if (sourceUnique && !targetUnique) {
      return 'one_to_many'; // Each source row maps to multiple target rows
    } else {
      return 'many_to_many';
    }
  }

  // ==================== COLUMN MAPPING ====================

  /**
   * Auto-map columns between datasets
   */
  async autoMapColumns(
    sourceColumns: Array<{ name: string; data: any[] }>,
    targetColumns: string[]
  ): Promise<ColumnMapping[]> {
    const mappings: ColumnMapping[] = [];

    for (const sourceCol of sourceColumns) {
      let bestMatch: ColumnMapping | null = null;
      let bestConfidence = 0;

      for (const targetCol of targetColumns) {
        const mapping = await this.analyzeColumnMapping(
          sourceCol.name,
          sourceCol.data,
          targetCol
        );

        if (mapping.confidence > bestConfidence) {
          bestConfidence = mapping.confidence;
          bestMatch = mapping;
        }
      }

      if (bestMatch && bestMatch.confidence > 0.6) {
        mappings.push(bestMatch);
      }
    }

    return mappings.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Analyze mapping between two columns
   */
  private async analyzeColumnMapping(
    sourceCol: string,
    sourceData: any[],
    targetCol: string
  ): Promise<ColumnMapping> {
    const nameSimilarity = this.calculateNameSimilarity(sourceCol, targetCol);
    
    let confidence = nameSimilarity;
    let reasoning = '';
    let transformation: string | undefined;

    // Exact match
    if (sourceCol.toLowerCase() === targetCol.toLowerCase()) {
      confidence = 1.0;
      reasoning = 'Exact name match';
    }
    // Similar names
    else if (nameSimilarity > 0.8) {
      confidence = nameSimilarity;
      reasoning = `Similar names (${(nameSimilarity * 100).toFixed(0)}% match)`;
    }
    // Semantic match
    else {
      const semantic = this.checkSemanticMatch(sourceCol, targetCol);
      if (semantic.matches) {
        confidence = 0.85;
        reasoning = semantic.reasoning;
        transformation = semantic.transformation;
      }
    }

    return {
      sourceColumn: sourceCol,
      targetColumn: targetCol,
      confidence,
      reasoning,
      transformation,
    };
  }

  /**
   * Check for semantic matches (e.g., fname → first_name)
   */
  private checkSemanticMatch(
    sourceCol: string,
    targetCol: string
  ): { matches: boolean; reasoning: string; transformation?: string } {
    const src = sourceCol.toLowerCase();
    const tgt = targetCol.toLowerCase();

    // Common abbreviations
    const abbreviations: Record<string, string[]> = {
      'fname': ['first_name', 'firstname', 'given_name'],
      'lname': ['last_name', 'lastname', 'surname'],
      'addr': ['address'],
      'tel': ['telephone', 'phone'],
      'qty': ['quantity', 'amount'],
      'desc': ['description'],
      'num': ['number'],
      'amt': ['amount'],
      'pct': ['percent', 'percentage'],
    };

    for (const [abbr, fullNames] of Object.entries(abbreviations)) {
      if (src === abbr && fullNames.some(fn => tgt.includes(fn))) {
        return {
          matches: true,
          reasoning: `Common abbreviation: ${abbr} → ${tgt}`,
        };
      }
      if (tgt === abbr && fullNames.some(fn => src.includes(fn))) {
        return {
          matches: true,
          reasoning: `Common abbreviation: ${tgt} → ${src}`,
        };
      }
    }

    // Compound names (first_name + last_name → full_name)
    if ((src.includes('first') && tgt.includes('full')) ||
        (src.includes('given') && tgt.includes('full'))) {
      return {
        matches: true,
        reasoning: 'Part of composite field',
        transformation: 'value + " " + row.last_name',
      };
    }

    return { matches: false, reasoning: '' };
  }

  // ==================== TRANSFORMATION SUGGESTIONS ====================

  /**
   * Suggest transformations for a column
   */
  async suggestTransformations(
    columnName: string,
    data: any[]
  ): Promise<TransformationSuggestion> {
    const profile = await this.profileColumn(columnName, data);
    const transformations: TransformationSuggestion['transformations'] = [];

    // Detect and suggest based on patterns
    const samples = profile.examples.filter(e => e !== null && e !== undefined);

    // Email cleaning
    if (this.matchesPattern(samples, DATA_PATTERNS.email, 0.8)) {
      transformations.push({
        type: 'clean',
        description: 'Clean and validate email addresses',
        code: 'value.toLowerCase().trim()',
        confidence: 0.9,
        examples: [
          { input: ' JOHN@EXAMPLE.COM ', output: 'john@example.com' },
          { input: 'Invalid Email', output: null },
        ],
      });
    }

    // Phone number formatting
    if (this.matchesPattern(samples, DATA_PATTERNS.phone, 0.7)) {
      transformations.push({
        type: 'format',
        description: 'Format phone numbers consistently',
        code: 'value.replace(/\\D/g, "").replace(/(\\d{3})(\\d{3})(\\d{4})/, "($1) $2-$3")',
        confidence: 0.85,
        examples: [
          { input: '1234567890', output: '(123) 456-7890' },
          { input: '123-456-7890', output: '(123) 456-7890' },
        ],
      });
    }

    // Date formatting
    if (this.matchesPattern(samples, DATA_PATTERNS.dateISO, 0.8)) {
      transformations.push({
        type: 'format',
        description: 'Parse and standardize dates',
        code: 'new Date(value).toISOString()',
        confidence: 0.9,
        examples: [
          { input: '2025-10-06', output: '2025-10-06T00:00:00.000Z' },
        ],
      });
    }

    // Extract domain from email
    if (profile.column.toLowerCase().includes('email')) {
      transformations.push({
        type: 'extract',
        description: 'Extract email domain',
        code: 'value.split("@")[1]',
        confidence: 0.85,
        examples: [
          { input: 'john@example.com', output: 'example.com' },
        ],
      });
    }

    // Split full name
    if (profile.column.toLowerCase().includes('name') && !profile.column.includes('first') && !profile.column.includes('last')) {
      const hasSpaces = samples.some(s => typeof s === 'string' && s.includes(' '));
      if (hasSpaces) {
        transformations.push({
          type: 'split',
          description: 'Split full name into first and last',
          code: 'value.split(" ")[0] // first name',
          confidence: 0.75,
          examples: [
            { input: 'John Doe', output: 'John' },
          ],
        });
      }
    }

    // Remove currency symbols
    if (this.matchesPattern(samples, DATA_PATTERNS.currency, 0.7)) {
      transformations.push({
        type: 'clean',
        description: 'Remove currency symbols and parse as number',
        code: 'parseFloat(value.replace(/[^0-9.-]/g, ""))',
        confidence: 0.9,
        examples: [
          { input: '$1,234.56', output: 1234.56 },
          { input: '€999.99', output: 999.99 },
        ],
      });
    }

    // Trim whitespace
    const hasWhitespace = samples.some(s => 
      typeof s === 'string' && (s.startsWith(' ') || s.endsWith(' '))
    );
    if (hasWhitespace) {
      transformations.push({
        type: 'clean',
        description: 'Remove leading/trailing whitespace',
        code: 'value.trim()',
        confidence: 1.0,
        examples: [
          { input: '  text  ', output: 'text' },
        ],
      });
    }

    // Convert to uppercase/lowercase
    const hasCase = samples.every(s => typeof s === 'string');
    if (hasCase && profile.column.toLowerCase().includes('code')) {
      transformations.push({
        type: 'format',
        description: 'Standardize to uppercase',
        code: 'value.toUpperCase()',
        confidence: 0.7,
        examples: [
          { input: 'us', output: 'US' },
        ],
      });
    }

    return {
      column: profile.column,
      currentType: profile.dataType,
      transformations,
    };
  }

  // ==================== DATA QUALITY DETECTION ====================

  /**
   * Detect data quality issues
   */
  async detectQualityIssues(
    tableName: string,
    data: any[]
  ): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];

    if (data.length === 0) {
      return issues;
    }

    const columns = Object.keys(data[0]);

    for (const column of columns) {
      const columnIssues = await this.analyzeColumnQuality(column, data);
      issues.push(...columnIssues);
    }

    // Check for duplicate records
    const duplicateCount = this.findDuplicateRecords(data);
    if (duplicateCount > 0) {
      issues.push({
        severity: 'warning',
        category: 'duplicates',
        description: `${duplicateCount} duplicate records found`,
        affectedRecords: duplicateCount,
        suggestion: 'Use deduplicate transformation to remove duplicates',
        autoFixAvailable: true,
      });
    }

    return issues.sort((a, b) => {
      const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Analyze quality for a single column
   */
  private async analyzeColumnQuality(column: string, data: any[]): Promise<DataQualityIssue[]> {
    const issues: DataQualityIssue[] = [];
    const values = data.map(r => r[column]);

    // Check for missing values
    const nullCount = values.filter(v => v === null || v === undefined || v === '').length;
    const nullPercentage = (nullCount / data.length) * 100;

    if (nullPercentage > 0) {
      const severity = nullPercentage > 50 ? 'error' : nullPercentage > 20 ? 'warning' : 'info';
      issues.push({
        severity,
        category: 'missing_values',
        column,
        description: `${nullPercentage.toFixed(1)}% missing values in ${column}`,
        affectedRecords: nullCount,
        suggestion: nullPercentage > 50 
          ? 'Consider using filter to remove null rows or provide default values'
          : 'Consider providing default values for missing data',
        autoFixAvailable: true,
      });
    }

    // Check for format inconsistencies
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    if (nonNullValues.length > 0 && typeof nonNullValues[0] === 'string') {
      // Email format check
      if (column.toLowerCase().includes('email')) {
        const invalidEmails = nonNullValues.filter(v => !DATA_PATTERNS.email.test(v));
        if (invalidEmails.length > 0) {
          issues.push({
            severity: 'warning',
            category: 'format',
            column,
            description: `${invalidEmails.length} invalid email formats in ${column}`,
            affectedRecords: invalidEmails.length,
            suggestion: 'Use transformation to clean email addresses or filter invalid entries',
            autoFixAvailable: true,
          });
        }
      }

      // Phone format check
      if (column.toLowerCase().includes('phone') || column.toLowerCase().includes('tel')) {
        const invalidPhones = nonNullValues.filter(v => !DATA_PATTERNS.phone.test(v));
        if (invalidPhones.length > 0) {
          issues.push({
            severity: 'info',
            category: 'format',
            column,
            description: `${invalidPhones.length} non-standard phone formats in ${column}`,
            affectedRecords: invalidPhones.length,
            suggestion: 'Apply phone number formatting transformation',
            autoFixAvailable: true,
          });
        }
      }

      // Check for mixed case
      const hasLowercase = nonNullValues.some(v => /[a-z]/.test(v));
      const hasUppercase = nonNullValues.some(v => /[A-Z]/.test(v));
      
      if (hasLowercase && hasUppercase && column.toLowerCase().includes('code')) {
        issues.push({
          severity: 'info',
          category: 'consistency',
          column,
          description: `Mixed case detected in ${column} (should be standardized)`,
          affectedRecords: nonNullValues.length,
          suggestion: 'Apply toUpperCase() or toLowerCase() transformation',
          autoFixAvailable: true,
        });
      }
    }

    // Check for outliers (numeric columns)
    if (nonNullValues.length > 0 && typeof nonNullValues[0] === 'number') {
      const outliers = this.detectOutliers(nonNullValues);
      if (outliers.length > 0) {
        issues.push({
          severity: 'info',
          category: 'outliers',
          column,
          description: `${outliers.length} potential outliers detected in ${column}`,
          affectedRecords: outliers.length,
          suggestion: 'Review outlier values for data quality issues',
          autoFixAvailable: false,
        });
      }
    }

    return issues;
  }

  // ==================== DATA PROFILING ====================

  /**
   * Profile a column to understand its characteristics
   */
  async profileColumn(columnName: string, data: any[]): Promise<DataProfile> {
    const values = data.map(r => r[columnName]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined);

    const dataType = this.inferDataType(data, columnName);
    const detectedFormat = this.detectFormat(nonNullValues);

    const uniqueValues = new Set(nonNullValues);
    const duplicateCount = nonNullValues.length - uniqueValues.size;

    let minValue, maxValue, avgLength;

    if (dataType === 'number') {
      minValue = Math.min(...nonNullValues.filter(v => typeof v === 'number'));
      maxValue = Math.max(...nonNullValues.filter(v => typeof v === 'number'));
    }

    if (dataType === 'string') {
      const lengths = nonNullValues.filter(v => typeof v === 'string').map(v => v.length);
      avgLength = lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
    }

    const patterns = this.detectPatterns(nonNullValues.slice(0, 100));
    const examples = nonNullValues.slice(0, 5);

    return {
      column: columnName,
      dataType,
      detectedFormat,
      totalRecords: data.length,
      nullCount: values.length - nonNullValues.length,
      uniqueCount: uniqueValues.size,
      duplicateCount,
      minValue,
      maxValue,
      avgLength,
      patterns,
      examples,
    };
  }

  /**
   * Infer data type from column values
   */
  private inferDataType(data: any[], column: string): string {
    const samples = data.slice(0, 100).map(r => r[column]).filter(v => v !== null && v !== undefined);
    
    if (samples.length === 0) return 'unknown';

    const types = samples.map(v => typeof v);
    const typeCount = types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get most common type
    const dominantType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0][0];

    return dominantType;
  }

  /**
   * Detect format patterns in data
   */
  private detectFormat(values: any[]): string | undefined {
    if (values.length === 0) return undefined;

    const samples = values.slice(0, 100);

    for (const [formatName, pattern] of Object.entries(DATA_PATTERNS)) {
      if (this.matchesPattern(samples, pattern, 0.8)) {
        return formatName;
      }
    }

    return undefined;
  }

  /**
   * Detect common patterns in data
   */
  private detectPatterns(values: any[]): string[] {
    const patterns: string[] = [];

    for (const [name, pattern] of Object.entries(DATA_PATTERNS)) {
      if (this.matchesPattern(values, pattern, 0.6)) {
        patterns.push(name);
      }
    }

    // Detect custom patterns
    if (values.every(v => typeof v === 'string')) {
      const stringValues = values as string[];
      
      // All uppercase
      if (stringValues.every(v => v === v.toUpperCase())) {
        patterns.push('uppercase');
      }
      
      // All lowercase
      if (stringValues.every(v => v === v.toLowerCase())) {
        patterns.push('lowercase');
      }
      
      // Fixed length
      const lengths = new Set(stringValues.map(v => v.length));
      if (lengths.size === 1) {
        patterns.push(`fixed-length-${Array.from(lengths)[0]}`);
      }
    }

    return patterns;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Check if values match a pattern
   */
  private matchesPattern(values: any[], pattern: RegExp, threshold: number): boolean {
    const matches = values.filter(v => 
      typeof v === 'string' && pattern.test(v)
    ).length;

    return (matches / values.length) >= threshold;
  }

  /**
   * Find duplicate records
   */
  private findDuplicateRecords(data: any[]): number {
    const seen = new Set<string>();
    let duplicates = 0;

    for (const record of data) {
      const key = JSON.stringify(record, Object.keys(record).sort());
      if (seen.has(key)) {
        duplicates++;
      } else {
        seen.add(key);
      }
    }

    return duplicates;
  }

  /**
   * Detect outliers using IQR method
   */
  private detectOutliers(values: number[]): number[] {
    if (values.length < 4) return [];

    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    
    const lowerBound = q1 - (1.5 * iqr);
    const upperBound = q3 + (1.5 * iqr);

    return values.filter(v => v < lowerBound || v > upperBound);
  }

  /**
   * Levenshtein distance for string similarity
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,    // deletion
            dp[i][j - 1] + 1,    // insertion
            dp[i - 1][j - 1] + 1 // substitution
          );
        }
      }
    }

    return dp[m][n];
  }
}

// Export singleton instance
export const aiAssistant = AIAssistant.getInstance();

