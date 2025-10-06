/**
 * CDC Manager Unit Tests
 */

import { CDCManager, CDCConfig, MergeStrategy } from '../../lib/services/CDCManager';

describe('CDCManager', () => {
  let cdcManager: CDCManager;

  beforeEach(() => {
    cdcManager = CDCManager.getInstance();
  });

  describe('Hash-based Change Detection', () => {
    it('should detect inserts', async () => {
      const config: CDCConfig = {
        dataSourceId: 'test-source',
        trackingMode: 'hash',
        primaryKey: 'id',
        enableDeletes: false,
      };

      const existingData = [
        { id: 1, name: 'John', email: 'john@example.com' },
      ];

      const newData = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
      ];

      const result = await cdcManager.incrementalSync('test-source', newData, existingData, config);

      expect(result.changeSet.inserts).toHaveLength(1);
      expect(result.changeSet.inserts[0].id).toBe(2);
      expect(result.changeSet.updates).toHaveLength(0);
      expect(result.changeSet.unchanged).toBe(1);
    });

    it('should detect updates', async () => {
      const config: CDCConfig = {
        dataSourceId: 'test-source',
        trackingMode: 'hash',
        primaryKey: 'id',
        enableDeletes: false,
      };

      const existingData = [
        { id: 1, name: 'John', email: 'john@old.com' },
      ];

      const newData = [
        { id: 1, name: 'John', email: 'john@new.com' },
      ];

      const result = await cdcManager.incrementalSync('test-source', newData, existingData, config);

      expect(result.changeSet.updates).toHaveLength(1);
      expect(result.changeSet.updates[0].after.email).toBe('john@new.com');
      expect(result.changeSet.inserts).toHaveLength(0);
    });

    it('should detect deletes when enabled', async () => {
      const config: CDCConfig = {
        dataSourceId: 'test-source',
        trackingMode: 'hash',
        primaryKey: 'id',
        enableDeletes: true,
      };

      const existingData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];

      const newData = [
        { id: 1, name: 'John' },
      ];

      const result = await cdcManager.incrementalSync('test-source', newData, existingData, config);

      expect(result.changeSet.deletes).toHaveLength(1);
      expect(result.changeSet.deletes[0].id).toBe(2);
    });
  });

  describe('Merge Operations', () => {
    it('should merge with source-wins strategy', async () => {
      const config: CDCConfig = {
        dataSourceId: 'test-source',
        trackingMode: 'hash',
        primaryKey: 'id',
      };

      const existingData = [
        { id: 1, name: 'Old Name' },
      ];

      const changeSet = {
        inserts: [{ id: 2, name: 'New Record' }],
        updates: [
          {
            before: { id: 1, name: 'Old Name' },
            after: { id: 1, name: 'Updated Name' },
          },
        ],
        deletes: [],
        unchanged: 0,
        totalRecords: 2,
        timestamp: new Date(),
      };

      const strategy: MergeStrategy = {
        onConflict: 'source-wins',
        softDelete: false,
      };

      const merged = await cdcManager.mergeChanges(existingData, changeSet, config, strategy);

      expect(merged).toHaveLength(2);
      expect(merged.find(r => r.id === 1)?.name).toBe('Updated Name');
      expect(merged.find(r => r.id === 2)?.name).toBe('New Record');
    });

    it('should handle soft deletes', async () => {
      const config: CDCConfig = {
        dataSourceId: 'test-source',
        trackingMode: 'hash',
        primaryKey: 'id',
      };

      const existingData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];

      const changeSet = {
        inserts: [],
        updates: [],
        deletes: [{ id: 2, name: 'Jane' }],
        unchanged: 0,
        totalRecords: 1,
        timestamp: new Date(),
      };

      const strategy: MergeStrategy = {
        onConflict: 'source-wins',
        softDelete: true,
      };

      const merged = await cdcManager.mergeChanges(existingData, changeSet, config, strategy);

      expect(merged).toHaveLength(2);
      expect(merged.find(r => r.id === 2)?._deleted).toBe(true);
    });
  });

  describe('Change Statistics', () => {
    it('should calculate change rates correctly', () => {
      const changeSet = {
        inserts: [1, 2, 3],
        updates: [1, 2],
        deletes: [1],
        unchanged: 94,
        totalRecords: 100,
        timestamp: new Date(),
      };

      const stats = cdcManager.calculateChangeStats(changeSet as any);

      expect(stats.insertRate).toBe(3);
      expect(stats.updateRate).toBe(2);
      expect(stats.deleteRate).toBe(1);
      expect(stats.unchangedRate).toBe(94);
      expect(stats.totalChanges).toBe(6);
    });
  });
});

