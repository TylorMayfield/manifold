import { SeparatedDatabaseManager } from '../../../lib/database/SeparatedDatabaseManager';

describe('SeparatedDatabaseManager', () => {
  let manager: SeparatedDatabaseManager;

  beforeEach(() => {
    manager = SeparatedDatabaseManager.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = SeparatedDatabaseManager.getInstance();
    const instance2 = SeparatedDatabaseManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should have all required methods', () => {
    expect(typeof manager.getDataSources).toBe('function');
    expect(typeof manager.getDataSourceDb).toBe('function');
    expect(typeof manager.importData).toBe('function');
    expect(typeof manager.getDataSourceData).toBe('function');
    expect(typeof manager.createDataSource).toBe('function');
    expect(typeof manager.updateDataSource).toBe('function');
    expect(typeof manager.deleteDataSource).toBe('function');
  });

  test('should create data source with generated ID', async () => {
    const config = { name: 'Test', type: 'csv' };
    const result = await manager.createDataSource('proj_123', config);
    expect(result.id).toBeDefined();
    expect(result.name).toBe('Test');
  });

  test('should get data sources returns array', async () => {
    const sources = await manager.getDataSources('proj_123');
    expect(Array.isArray(sources)).toBe(true);
  });

  test('should handle operations gracefully', async () => {
    await expect(manager.updateDataSource('p1', 'd1', {})).resolves.not.toThrow();
    await expect(manager.deleteDataSource('p1', 'd1')).resolves.not.toThrow();
    await expect(manager.closeAll()).resolves.not.toThrow();
  });
});
