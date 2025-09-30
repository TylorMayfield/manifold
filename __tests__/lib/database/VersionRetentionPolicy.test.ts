import { SeparatedDatabaseManager, VersionRetentionPolicy } from '../../../lib/database/SeparatedDatabaseManager';

describe('VersionRetentionPolicy', () => {
  let manager: SeparatedDatabaseManager;
  const testProjectId = 'proj_retention_test';
  let testCounter = 0;

  function getUniqueDataSourceId(): string {
    testCounter++;
    return `ds_retention_test_${testCounter}_${Date.now()}`;
  }

  beforeEach(() => {
    manager = SeparatedDatabaseManager.getInstance();
  });

  describe('Retention Policy Configuration', () => {
    it('should set and get retention policy', async () => {
      const dsId = getUniqueDataSourceId();
      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 5,
        autoCleanup: true
      };

      await manager.setRetentionPolicy(testProjectId, dsId, policy);
      const retrieved = await manager.getRetentionPolicy(testProjectId, dsId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.strategy).toBe('keep-last');
      expect(retrieved?.value).toBe(5);
      expect(retrieved?.autoCleanup).toBe(true);
    });

    it('should return null for non-existent policy', async () => {
      const policy = await manager.getRetentionPolicy('non-existent', 'non-existent');
      expect(policy).toBeNull();
    });

    it('should update existing policy', async () => {
      const dsId = getUniqueDataSourceId();
      const policy1: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 5
      };

      await manager.setRetentionPolicy(testProjectId, dsId, policy1);

      const policy2: VersionRetentionPolicy = {
        strategy: 'keep-days',
        value: 30,
        autoCleanup: true
      };

      await manager.setRetentionPolicy(testProjectId, dsId, policy2);
      const retrieved = await manager.getRetentionPolicy(testProjectId, dsId);

      expect(retrieved?.strategy).toBe('keep-days');
      expect(retrieved?.value).toBe(30);
    });
  });

  describe('Keep-Last Strategy', () => {
    it('should keep only specified number of versions', async () => {
      const dsId = getUniqueDataSourceId();
      // Import multiple versions
      for (let i = 0; i < 10; i++) {
        await manager.importData(testProjectId, dsId, [
          { id: i, data: `Version ${i}` }
        ]);
      }

      // Apply keep-last policy
      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 5
      };

      const deletedCount = await manager.applyRetentionPolicy(testProjectId, dsId, policy);

      expect(deletedCount).toBe(5); // Should delete 5 old versions

      // Verify only 5 versions remain
      const versions = await manager.getDataVersions(testProjectId, dsId);
      expect(versions.length).toBe(5);
    });

    it('should not delete versions if total is less than keep count', async () => {
      const dsId = getUniqueDataSourceId();
      // Import 3 versions
      for (let i = 0; i < 3; i++) {
        await manager.importData(testProjectId, dsId, [
          { id: i, data: `Version ${i}` }
        ]);
      }

      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 10 // Keep 10, but only 3 exist
      };

      const deletedCount = await manager.applyRetentionPolicy(testProjectId, dsId, policy);

      expect(deletedCount).toBe(0); // Nothing should be deleted
    });
  });

  describe('Keep-All Strategy', () => {
    it('should not delete any versions', async () => {
      const dsId = getUniqueDataSourceId();
      // Import multiple versions
      for (let i = 0; i < 10; i++) {
        await manager.importData(testProjectId, dsId, [
          { id: i, data: `Version ${i}` }
        ]);
      }

      const policy: VersionRetentionPolicy = {
        strategy: 'keep-all'
      };

      const deletedCount = await manager.applyRetentionPolicy(testProjectId, dsId, policy);

      expect(deletedCount).toBe(0);

      // Verify all versions remain
      const versions = await manager.getDataVersions(testProjectId, dsId);
      expect(versions.length).toBe(10);
    });
  });

  describe('Keep-Days Strategy', () => {
    it('should keep versions within specified days', async () => {
      const dsId = getUniqueDataSourceId();
      // This test would need to manipulate dates, so we'll just test the interface
      const policy: VersionRetentionPolicy = {
        strategy: 'keep-days',
        value: 7
      };

      // Import some data
      await manager.importData(testProjectId, dsId, [
        { id: 1, data: 'Test' }
      ]);

      // Apply policy (should not delete recent versions)
      const deletedCount = await manager.applyRetentionPolicy(testProjectId, dsId, policy);

      expect(deletedCount).toBe(0); // Recent version should not be deleted
    });
  });

  describe('Auto-Cleanup on Import', () => {
    it('should automatically clean up when autoCleanup is enabled', async () => {
      const dsId = getUniqueDataSourceId();
      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 3,
        autoCleanup: true
      };

      // Import 5 versions with auto-cleanup
      for (let i = 0; i < 5; i++) {
        await manager.importData(
          testProjectId,
          dsId,
          [{ id: i, data: `Version ${i}` }],
          undefined,
          policy
        );
      }

      // Should only have 3 versions left
      const versions = await manager.getDataVersions(testProjectId, dsId);
      expect(versions.length).toBeLessThanOrEqual(3);
    });

    it('should not clean up when autoCleanup is false', async () => {
      const dsId = getUniqueDataSourceId();
      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 3,
        autoCleanup: false
      };

      // Import 5 versions without auto-cleanup
      for (let i = 0; i < 5; i++) {
        await manager.importData(
          testProjectId,
          dsId,
          [{ id: i, data: `Version ${i}` }],
          undefined,
          policy
        );
      }

      // Should have all 5 versions
      const versions = await manager.getDataVersions(testProjectId, dsId);
      expect(versions.length).toBe(5);
    });
  });

  describe('Retention Info', () => {
    it('should provide retention information', async () => {
      const dsId = getUniqueDataSourceId();
      // Import some versions
      for (let i = 0; i < 10; i++) {
        await manager.importData(testProjectId, dsId, [
          { id: i, data: `Version ${i}` }
        ]);
      }

      // Set policy
      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 5
      };
      await manager.setRetentionPolicy(testProjectId, dsId, policy);

      // Get retention info
      const info = await manager.getRetentionInfo(testProjectId, dsId);

      expect(info.policy).toBeDefined();
      expect(info.totalVersions).toBe(10);
      expect(info.oldestVersion).toBeInstanceOf(Date);
      expect(info.newestVersion).toBeInstanceOf(Date);
      expect(info.estimatedDeletableVersions).toBe(5); // 10 total - 5 to keep
    });

    it('should calculate estimated deletable versions correctly', async () => {
      const dsId = getUniqueDataSourceId();
      // Import 7 versions
      for (let i = 0; i < 7; i++) {
        await manager.importData(testProjectId, dsId, [
          { id: i, data: `Version ${i}` }
        ]);
      }

      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 3
      };
      await manager.setRetentionPolicy(testProjectId, dsId, policy);

      const info = await manager.getRetentionInfo(testProjectId, dsId);

      expect(info.totalVersions).toBe(7);
      expect(info.estimatedDeletableVersions).toBe(4); // 7 - 3
    });

    it('should show zero deletable for keep-all strategy', async () => {
      const dsId = getUniqueDataSourceId();
      // Import versions
      for (let i = 0; i < 10; i++) {
        await manager.importData(testProjectId, dsId, [
          { id: i, data: `Version ${i}` }
        ]);
      }

      const policy: VersionRetentionPolicy = {
        strategy: 'keep-all'
      };
      await manager.setRetentionPolicy(testProjectId, dsId, policy);

      const info = await manager.getRetentionInfo(testProjectId, dsId);

      expect(info.estimatedDeletableVersions).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero value in keep-last policy', async () => {
      const dsId = getUniqueDataSourceId();
      await manager.importData(testProjectId, dsId, [
        { id: 1, data: 'Test' }
      ]);

      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 0
      };

      // Should use default of 10 when value is 0
      const deletedCount = await manager.applyRetentionPolicy(testProjectId, dsId, policy);
      expect(deletedCount).toBe(0); // No deletion since we only have 1 version
    });

    it('should handle very large keep count', async () => {
      const dsId = getUniqueDataSourceId();
      for (let i = 0; i < 5; i++) {
        await manager.importData(testProjectId, dsId, [
          { id: i, data: `Version ${i}` }
        ]);
      }

      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last',
        value: 1000 // Keep more than exist
      };

      const deletedCount = await manager.applyRetentionPolicy(testProjectId, dsId, policy);
      expect(deletedCount).toBe(0);
    });

    it('should handle policy with no value for keep-last', async () => {
      const dsId = getUniqueDataSourceId();
      for (let i = 0; i < 15; i++) {
        await manager.importData(testProjectId, dsId, [
          { id: i, data: `Version ${i}` }
        ]);
      }

      const policy: VersionRetentionPolicy = {
        strategy: 'keep-last'
        // No value specified, should default to 10
      };

      const deletedCount = await manager.applyRetentionPolicy(testProjectId, dsId, policy);
      expect(deletedCount).toBe(5); // 15 - 10 = 5
    });
  });

  describe('Integration Tests', () => {
    it('should work with data source configuration', async () => {
      const config = await manager.createDataSource(testProjectId, {
        name: 'Test Source with Retention',
        type: 'csv',
        versionRetention: {
          strategy: 'keep-last',
          value: 5,
          autoCleanup: true
        }
      });

      expect(config.versionRetention).toBeDefined();
      expect(config.versionRetention?.strategy).toBe('keep-last');
      expect(config.versionRetention?.value).toBe(5);
    });

    it('should persist policy across database reopens', async () => {
      const dsId = getUniqueDataSourceId();
      const policy: VersionRetentionPolicy = {
        strategy: 'keep-days',
        value: 30,
        autoCleanup: true
      };

      await manager.setRetentionPolicy(testProjectId, dsId, policy);

      // Close and reopen
      await manager.closeDataSource(testProjectId, dsId);
      
      // Get policy again
      const retrieved = await manager.getRetentionPolicy(testProjectId, dsId);

      expect(retrieved?.strategy).toBe('keep-days');
      expect(retrieved?.value).toBe(30);
    });
  });
});
