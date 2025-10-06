/**
 * Snapshot Differ
 * 
 * Compares two data snapshots and identifies differences at the record and field level.
 * 
 * Features:
 * - Record-level changes (added, removed, modified, unchanged)
 * - Field-level changes within modified records
 * - Support for different comparison keys
 * - Change statistics and summary
 * - Detailed diff metadata
 */

import { logger } from '../utils/logger';
import crypto from 'crypto';

// ==================== TYPES ====================

export interface SnapshotComparison {
  fromSnapshotId: string;
  toSnapshotId: string;
  fromVersion: number;
  toVersion: number;
  comparisonKey: string | string[];
  timestamp: Date;
  summary: ComparisonSummary;
  changes: RecordChange[];
  statistics: ComparisonStatistics;
}

export interface ComparisonSummary {
  totalRecordsFrom: number;
  totalRecordsTo: number;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  changePercentage: number;
}

export interface ComparisonStatistics {
  totalFieldChanges: number;
  fieldsChanged: Map<string, number>; // field name -> change count
  topChangedFields: Array<{ field: string; count: number }>;
  largestChange?: RecordChange;
  averageFieldChangesPerRecord: number;
}

export interface RecordChange {
  key: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  before?: any;
  after?: any;
  fieldChanges?: FieldChange[];
  metadata?: {
    hash?: string;
    timestamp?: Date;
  };
}

export interface FieldChange {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
  valueType: string;
  displayOldValue: string;
  displayNewValue: string;
}

export interface DiffOptions {
  ignoreFields?: string[];
  caseSensitive?: boolean;
  trimStrings?: boolean;
  deepCompare?: boolean;
  includeUnchanged?: boolean;
  maxRecords?: number;
}

// ==================== SNAPSHOT DIFFER ====================

export class SnapshotDiffer {
  private static instance: SnapshotDiffer;

  static getInstance(): SnapshotDiffer {
    if (!SnapshotDiffer.instance) {
      SnapshotDiffer.instance = new SnapshotDiffer();
    }
    return SnapshotDiffer.instance;
  }

  /**
   * Compare two snapshots and generate detailed diff
   */
  async compareSnapshots(
    fromSnapshot: { id: string; version: number; data: any[] },
    toSnapshot: { id: string; version: number; data: any[] },
    comparisonKey: string | string[],
    options: DiffOptions = {}
  ): Promise<SnapshotComparison> {
    const startTime = Date.now();

    logger.info('Starting snapshot comparison', 'snapshot-differ', {
      fromVersion: fromSnapshot.version,
      toVersion: toSnapshot.version,
      fromRecords: fromSnapshot.data.length,
      toRecords: toSnapshot.data.length,
    });

    // Build indices for both snapshots
    const fromIndex = this.buildIndex(fromSnapshot.data, comparisonKey);
    const toIndex = this.buildIndex(toSnapshot.data, comparisonKey);

    // Detect changes
    const changes: RecordChange[] = [];
    const fieldsChanged = new Map<string, number>();
    let totalFieldChanges = 0;

    // Find added and modified records
    for (const [key, toRecord] of toIndex) {
      const fromRecord = fromIndex.get(key);

      if (!fromRecord) {
        // Record added
        changes.push({
          key,
          changeType: 'added',
          after: toRecord,
        });
      } else {
        // Check if record was modified
        const fieldChanges = this.compareRecords(fromRecord, toRecord, options);

        if (fieldChanges.length > 0) {
          // Record modified
          changes.push({
            key,
            changeType: 'modified',
            before: fromRecord,
            after: toRecord,
            fieldChanges,
          });

          // Track field changes
          totalFieldChanges += fieldChanges.length;
          fieldChanges.forEach(fc => {
            fieldsChanged.set(fc.field, (fieldsChanged.get(fc.field) || 0) + 1);
          });
        } else if (options.includeUnchanged) {
          // Record unchanged
          changes.push({
            key,
            changeType: 'unchanged',
            before: fromRecord,
            after: toRecord,
          });
        }

        // Remove from fromIndex to track removals
        fromIndex.delete(key);
      }
    }

    // Find removed records (remaining in fromIndex)
    for (const [key, fromRecord] of fromIndex) {
      changes.push({
        key,
        changeType: 'removed',
        before: fromRecord,
      });
    }

    // Calculate statistics
    const added = changes.filter(c => c.changeType === 'added').length;
    const removed = changes.filter(c => c.changeType === 'removed').length;
    const modified = changes.filter(c => c.changeType === 'modified').length;
    const unchanged = changes.filter(c => c.changeType === 'unchanged').length;

    const totalChanges = added + removed + modified;
    const changePercentage = ((totalChanges / Math.max(fromSnapshot.data.length, toSnapshot.data.length)) * 100);

    // Top changed fields
    const topChangedFields = Array.from(fieldsChanged.entries())
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Largest change (most field changes)
    const largestChange = changes
      .filter(c => c.changeType === 'modified')
      .sort((a, b) => (b.fieldChanges?.length || 0) - (a.fieldChanges?.length || 0))[0];

    const statistics: ComparisonStatistics = {
      totalFieldChanges,
      fieldsChanged,
      topChangedFields,
      largestChange,
      averageFieldChangesPerRecord: modified > 0 ? totalFieldChanges / modified : 0,
    };

    const comparison: SnapshotComparison = {
      fromSnapshotId: fromSnapshot.id,
      toSnapshotId: toSnapshot.id,
      fromVersion: fromSnapshot.version,
      toVersion: toSnapshot.version,
      comparisonKey: comparisonKey,
      timestamp: new Date(),
      summary: {
        totalRecordsFrom: fromSnapshot.data.length,
        totalRecordsTo: toSnapshot.data.length,
        added,
        removed,
        modified,
        unchanged,
        changePercentage,
      },
      changes: options.maxRecords ? changes.slice(0, options.maxRecords) : changes,
      statistics,
    };

    const duration = Date.now() - startTime;

    logger.success('Snapshot comparison completed', 'snapshot-differ', {
      duration,
      added,
      removed,
      modified,
      unchanged,
      totalFieldChanges,
    });

    return comparison;
  }

  /**
   * Compare two records and find field-level changes
   */
  private compareRecords(
    fromRecord: any,
    toRecord: any,
    options: DiffOptions
  ): FieldChange[] {
    const changes: FieldChange[] = [];
    const allFields = new Set([
      ...Object.keys(fromRecord),
      ...Object.keys(toRecord),
    ]);

    for (const field of allFields) {
      // Skip ignored fields
      if (options.ignoreFields?.includes(field)) {
        continue;
      }

      const oldValue = fromRecord[field];
      const newValue = toRecord[field];

      // Normalize values for comparison
      const normalizedOld = this.normalizeValue(oldValue, options);
      const normalizedNew = this.normalizeValue(newValue, options);

      // Check if values are different
      if (!this.valuesEqual(normalizedOld, normalizedNew, options)) {
        const changeType = this.getFieldChangeType(oldValue, newValue);

        changes.push({
          field,
          oldValue: normalizedOld,
          newValue: normalizedNew,
          changeType,
          valueType: this.getValueType(newValue || oldValue),
          displayOldValue: this.formatDisplayValue(normalizedOld),
          displayNewValue: this.formatDisplayValue(normalizedNew),
        });
      }
    }

    return changes;
  }

  /**
   * Build index for fast lookups
   */
  private buildIndex(
    data: any[],
    comparisonKey: string | string[]
  ): Map<string, any> {
    const index = new Map<string, any>();
    const keys = Array.isArray(comparisonKey) ? comparisonKey : [comparisonKey];

    for (const record of data) {
      const key = this.buildCompositeKey(record, keys);
      index.set(key, record);
    }

    return index;
  }

  /**
   * Build composite key from multiple fields
   */
  private buildCompositeKey(record: any, keys: string[]): string {
    return keys.map(key => String(record[key] || '')).join('|');
  }

  /**
   * Normalize value for comparison
   */
  private normalizeValue(value: any, options: DiffOptions): any {
    if (value === undefined || value === null) {
      return null;
    }

    if (typeof value === 'string') {
      let normalized = value;
      
      if (options.trimStrings) {
        normalized = normalized.trim();
      }
      
      if (!options.caseSensitive) {
        normalized = normalized.toLowerCase();
      }
      
      return normalized;
    }

    return value;
  }

  /**
   * Check if two values are equal
   */
  private valuesEqual(a: any, b: any, options: DiffOptions): boolean {
    // Both null/undefined
    if (a === null && b === null) return true;
    if (a === undefined && b === undefined) return true;
    if ((a === null || a === undefined) && (b === null || b === undefined)) return true;

    // Different types
    if (typeof a !== typeof b) return false;

    // Primitive types
    if (typeof a !== 'object') {
      return a === b;
    }

    // Deep comparison for objects/arrays
    if (options.deepCompare) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    // Shallow comparison
    return a === b;
  }

  /**
   * Determine field change type
   */
  private getFieldChangeType(oldValue: any, newValue: any): 'added' | 'removed' | 'modified' {
    const hasOld = oldValue !== null && oldValue !== undefined;
    const hasNew = newValue !== null && newValue !== undefined;

    if (!hasOld && hasNew) return 'added';
    if (hasOld && !hasNew) return 'removed';
    return 'modified';
  }

  /**
   * Get value type for display
   */
  private getValueType(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    return typeof value;
  }

  /**
   * Format value for display
   */
  private formatDisplayValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return String(value);
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * Generate summary text for comparison
   */
  generateSummaryText(comparison: SnapshotComparison): string {
    const { summary } = comparison;
    const lines: string[] = [];

    lines.push(`Version ${comparison.fromVersion} → ${comparison.toVersion}`);
    lines.push('');
    lines.push(`Total Changes: ${summary.added + summary.removed + summary.modified}`);
    lines.push(`  ✅ Added: ${summary.added} records`);
    lines.push(`  ❌ Removed: ${summary.removed} records`);
    lines.push(`  ✏️  Modified: ${summary.modified} records`);
    lines.push(`  ⚪ Unchanged: ${summary.unchanged} records`);
    lines.push('');
    lines.push(`Change Rate: ${summary.changePercentage.toFixed(1)}%`);
    
    if (comparison.statistics.totalFieldChanges > 0) {
      lines.push('');
      lines.push(`Total Field Changes: ${comparison.statistics.totalFieldChanges}`);
      lines.push(`Avg Changes per Record: ${comparison.statistics.averageFieldChangesPerRecord.toFixed(1)}`);
    }

    return lines.join('\n');
  }

  /**
   * Export comparison to different formats
   */
  exportComparison(comparison: SnapshotComparison, format: 'json' | 'csv' | 'text'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(comparison, (key, value) => {
          // Convert Map to object for JSON serialization
          if (value instanceof Map) {
            return Object.fromEntries(value);
          }
          return value;
        }, 2);

      case 'csv':
        return this.exportToCSV(comparison);

      case 'text':
        return this.exportToText(comparison);

      default:
        return JSON.stringify(comparison, null, 2);
    }
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(comparison: SnapshotComparison): string {
    const lines: string[] = [];
    lines.push('Key,Change Type,Field,Old Value,New Value');

    for (const change of comparison.changes) {
      if (change.changeType === 'modified' && change.fieldChanges) {
        for (const fieldChange of change.fieldChanges) {
          lines.push([
            change.key,
            change.changeType,
            fieldChange.field,
            this.escapeCSV(fieldChange.displayOldValue),
            this.escapeCSV(fieldChange.displayNewValue),
          ].join(','));
        }
      } else {
        lines.push([
          change.key,
          change.changeType,
          '',
          '',
          '',
        ].join(','));
      }
    }

    return lines.join('\n');
  }

  /**
   * Export to plain text format
   */
  private exportToText(comparison: SnapshotComparison): string {
    const lines: string[] = [];
    
    lines.push('=' .repeat(80));
    lines.push(`SNAPSHOT COMPARISON: v${comparison.fromVersion} → v${comparison.toVersion}`);
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(this.generateSummaryText(comparison));
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('DETAILED CHANGES');
    lines.push('='.repeat(80));
    lines.push('');

    for (const change of comparison.changes) {
      if (change.changeType === 'added') {
        lines.push(`[+] ADDED: ${change.key}`);
      } else if (change.changeType === 'removed') {
        lines.push(`[-] REMOVED: ${change.key}`);
      } else if (change.changeType === 'modified' && change.fieldChanges) {
        lines.push(`[~] MODIFIED: ${change.key}`);
        for (const fieldChange of change.fieldChanges) {
          lines.push(`    ${fieldChange.field}:`);
          lines.push(`      Old: ${fieldChange.displayOldValue}`);
          lines.push(`      New: ${fieldChange.displayNewValue}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Escape CSV values
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

// Export singleton instance
export const snapshotDiffer = SnapshotDiffer.getInstance();

