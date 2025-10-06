/**
 * Snapshot Differ Unit Tests
 */

import { SnapshotDiffer, DiffOptions } from '../../lib/services/SnapshotDiffer';

describe('SnapshotDiffer', () => {
  let differ: SnapshotDiffer;

  beforeEach(() => {
    differ = SnapshotDiffer.getInstance();
  });

  describe('Change Detection', () => {
    it('should detect added records', async () => {
      const fromSnapshot = {
        id: 'v1',
        version: 1,
        data: [
          { id: 1, name: 'John' },
        ],
      };

      const toSnapshot = {
        id: 'v2',
        version: 2,
        data: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      };

      const comparison = await differ.compareSnapshots(
        fromSnapshot,
        toSnapshot,
        'id'
      );

      expect(comparison.summary.added).toBe(1);
      expect(comparison.summary.removed).toBe(0);
      expect(comparison.summary.modified).toBe(0);
      expect(comparison.summary.unchanged).toBe(0);
    });

    it('should detect removed records', async () => {
      const fromSnapshot = {
        id: 'v1',
        version: 1,
        data: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' },
        ],
      };

      const toSnapshot = {
        id: 'v2',
        version: 2,
        data: [
          { id: 1, name: 'John' },
        ],
      };

      const comparison = await differ.compareSnapshots(
        fromSnapshot,
        toSnapshot,
        'id'
      );

      expect(comparison.summary.removed).toBe(1);
      const removed = comparison.changes.find(c => c.changeType === 'removed');
      expect(removed?.before.id).toBe(2);
    });

    it('should detect field-level modifications', async () => {
      const fromSnapshot = {
        id: 'v1',
        version: 1,
        data: [
          { id: 1, name: 'John', email: 'john@old.com', age: 25 },
        ],
      };

      const toSnapshot = {
        id: 'v2',
        version: 2,
        data: [
          { id: 1, name: 'John', email: 'john@new.com', age: 26 },
        ],
      };

      const comparison = await differ.compareSnapshots(
        fromSnapshot,
        toSnapshot,
        'id'
      );

      expect(comparison.summary.modified).toBe(1);
      
      const modified = comparison.changes.find(c => c.changeType === 'modified');
      expect(modified?.fieldChanges).toHaveLength(2);
      
      const emailChange = modified?.fieldChanges?.find(fc => fc.field === 'email');
      expect(emailChange?.oldValue).toBe('john@old.com');
      expect(emailChange?.newValue).toBe('john@new.com');
    });
  });

  describe('Comparison Options', () => {
    it('should respect ignoreFields option', async () => {
      const fromSnapshot = {
        id: 'v1',
        version: 1,
        data: [
          { id: 1, name: 'John', _metadata: 'old' },
        ],
      };

      const toSnapshot = {
        id: 'v2',
        version: 2,
        data: [
          { id: 1, name: 'John', _metadata: 'new' },
        ],
      };

      const options: DiffOptions = {
        ignoreFields: ['_metadata'],
      };

      const comparison = await differ.compareSnapshots(
        fromSnapshot,
        toSnapshot,
        'id',
        options
      );

      expect(comparison.summary.modified).toBe(0);
      expect(comparison.summary.unchanged).toBe(0); // includeUnchanged is false by default
    });

    it('should handle case-insensitive comparison', async () => {
      const fromSnapshot = {
        id: 'v1',
        version: 1,
        data: [
          { id: 1, status: 'ACTIVE' },
        ],
      };

      const toSnapshot = {
        id: 'v2',
        version: 2,
        data: [
          { id: 1, status: 'active' },
        ],
      };

      const options: DiffOptions = {
        caseSensitive: false,
      };

      const comparison = await differ.compareSnapshots(
        fromSnapshot,
        toSnapshot,
        'id',
        options
      );

      expect(comparison.summary.modified).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('should calculate change percentage', async () => {
      const fromSnapshot = {
        id: 'v1',
        version: 1,
        data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: i })),
      };

      const toSnapshot = {
        id: 'v2',
        version: 2,
        data: [
          ...Array.from({ length: 90 }, (_, i) => ({ id: i, value: i })),
          ...Array.from({ length: 10 }, (_, i) => ({ id: i, value: i + 100 })), // 10 modified
        ],
      };

      const comparison = await differ.compareSnapshots(
        fromSnapshot,
        toSnapshot,
        'id'
      );

      expect(comparison.summary.modified).toBe(10);
      expect(comparison.summary.changePercentage).toBe(10);
    });
  });
});

