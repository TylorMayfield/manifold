/**
 * @jest-environment jsdom
 */

import { DatabaseService } from '../../lib/services/DatabaseService';

// Mock electron API
const mockElectronAPI = {
  executeSQL: jest.fn(),
  querySQL: jest.fn(),
  getProjects: jest.fn(),
  getDataSources: jest.fn(),
  getSnapshots: jest.fn()
};

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;

  beforeEach(() => {
    databaseService = DatabaseService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DatabaseService.getInstance();
      const instance2 = DatabaseService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('execute', () => {
    it('should execute SQL via electron API', async () => {
      const mockResult = { success: true, rowsAffected: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const result = await databaseService.execute('INSERT INTO test VALUES (?)', ['value']);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith('INSERT INTO test VALUES (?)', ['value']);
    });

    it('should handle execution errors', async () => {
      const error = new Error('SQL execution failed');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      await expect(databaseService.execute('INVALID SQL')).rejects.toThrow('SQL execution failed');
    });

    it('should fallback to browser mode when electron API is not available', async () => {
      // Remove electron API
      delete (window as any).electronAPI;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await databaseService.execute('SELECT * FROM test');

      expect(result).toEqual({ success: true });
      expect(consoleSpy).toHaveBeenCalledWith('SQL execution not supported in browser mode:', 'SELECT * FROM test');

      consoleSpy.mockRestore();
    });
  });

  describe('query', () => {
    it('should query SQL via electron API', async () => {
      const mockResults = [{ id: 1, name: 'test' }];
      mockElectronAPI.querySQL.mockResolvedValueOnce(mockResults);

      const result = await databaseService.query('SELECT * FROM test');

      expect(result).toEqual(mockResults);
      expect(mockElectronAPI.querySQL).toHaveBeenCalledWith('SELECT * FROM test', undefined);
    });

    it('should handle query errors', async () => {
      const error = new Error('SQL query failed');
      mockElectronAPI.querySQL.mockRejectedValueOnce(error);

      await expect(databaseService.query('INVALID SQL')).rejects.toThrow('SQL query failed');
    });

    it('should fallback to browser mode when electron API is not available', async () => {
      // Remove electron API
      delete (window as any).electronAPI;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await databaseService.query('SELECT * FROM test');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('SQL query not supported in browser mode:', 'SELECT * FROM test');

      consoleSpy.mockRestore();
    });
  });

  describe('getProjects', () => {
    it('should get projects via electron API', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' }
      ];
      mockElectronAPI.getProjects.mockResolvedValueOnce(mockProjects);

      const result = await databaseService.getProjects();

      expect(result).toEqual(mockProjects);
      expect(mockElectronAPI.getProjects).toHaveBeenCalled();
    });

    it('should handle getProjects errors', async () => {
      const error = new Error('Failed to get projects');
      mockElectronAPI.getProjects.mockRejectedValueOnce(error);

      await expect(databaseService.getProjects()).rejects.toThrow('Failed to get projects');
    });

    it('should fallback to browser mode', async () => {
      delete (window as any).electronAPI;

      const result = await databaseService.getProjects();

      expect(result).toEqual([]);
    });
  });

  describe('getDataSources', () => {
    it('should get data sources via electron API', async () => {
      const mockDataSources = [
        { id: 1, name: 'Source 1', type: 'mysql' },
        { id: 2, name: 'Source 2', type: 'postgres' }
      ];
      mockElectronAPI.getDataSources.mockResolvedValueOnce(mockDataSources);

      const result = await databaseService.getDataSources();

      expect(result).toEqual(mockDataSources);
      expect(mockElectronAPI.getDataSources).toHaveBeenCalled();
    });

    it('should handle getDataSources errors', async () => {
      const error = new Error('Failed to get data sources');
      mockElectronAPI.getDataSources.mockRejectedValueOnce(error);

      await expect(databaseService.getDataSources()).rejects.toThrow('Failed to get data sources');
    });

    it('should fallback to browser mode', async () => {
      delete (window as any).electronAPI;

      const result = await databaseService.getDataSources();

      expect(result).toEqual([]);
    });
  });

  describe('getSnapshots', () => {
    it('should get snapshots via electron API', async () => {
      const mockSnapshots = [
        { id: 1, name: 'Snapshot 1', createdAt: '2023-01-01' },
        { id: 2, name: 'Snapshot 2', createdAt: '2023-01-02' }
      ];
      mockElectronAPI.getSnapshots.mockResolvedValueOnce(mockSnapshots);

      const result = await databaseService.getSnapshots();

      expect(result).toEqual(mockSnapshots);
      expect(mockElectronAPI.getSnapshots).toHaveBeenCalled();
    });

    it('should handle getSnapshots errors', async () => {
      const error = new Error('Failed to get snapshots');
      mockElectronAPI.getSnapshots.mockRejectedValueOnce(error);

      await expect(databaseService.getSnapshots()).rejects.toThrow('Failed to get snapshots');
    });

    it('should fallback to browser mode', async () => {
      delete (window as any).electronAPI;

      const result = await databaseService.getSnapshots();

      expect(result).toEqual([]);
    });
  });

  describe('createProject', () => {
    it('should create project via SQL execution', async () => {
      const mockResult = { success: true, insertId: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const projectData = { name: 'New Project', description: 'Test project' };
      const result = await databaseService.createProject(projectData);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO projects'),
        expect.arrayContaining(['New Project', 'Test project'])
      );
    });

    it('should handle createProject errors', async () => {
      const error = new Error('Failed to create project');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      const projectData = { name: 'New Project' };

      await expect(databaseService.createProject(projectData)).rejects.toThrow('Failed to create project');
    });
  });

  describe('updateProject', () => {
    it('should update project via SQL execution', async () => {
      const mockResult = { success: true, rowsAffected: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const projectData = { id: 1, name: 'Updated Project' };
      const result = await databaseService.updateProject(projectData);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE projects'),
        expect.arrayContaining(['Updated Project', 1])
      );
    });

    it('should handle updateProject errors', async () => {
      const error = new Error('Failed to update project');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      const projectData = { id: 1, name: 'Updated Project' };

      await expect(databaseService.updateProject(projectData)).rejects.toThrow('Failed to update project');
    });
  });

  describe('deleteProject', () => {
    it('should delete project via SQL execution', async () => {
      const mockResult = { success: true, rowsAffected: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const result = await databaseService.deleteProject(1);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM projects'),
        [1]
      );
    });

    it('should handle deleteProject errors', async () => {
      const error = new Error('Failed to delete project');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      await expect(databaseService.deleteProject(1)).rejects.toThrow('Failed to delete project');
    });
  });

  describe('createDataSource', () => {
    it('should create data source via SQL execution', async () => {
      const mockResult = { success: true, insertId: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const dataSourceData = { 
        name: 'New Source', 
        type: 'mysql',
        connectionString: 'mysql://localhost:3306/test'
      };
      const result = await databaseService.createDataSource(dataSourceData);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO data_sources'),
        expect.arrayContaining(['New Source', 'mysql', 'mysql://localhost:3306/test'])
      );
    });

    it('should handle createDataSource errors', async () => {
      const error = new Error('Failed to create data source');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      const dataSourceData = { name: 'New Source', type: 'mysql' };

      await expect(databaseService.createDataSource(dataSourceData)).rejects.toThrow('Failed to create data source');
    });
  });

  describe('updateDataSource', () => {
    it('should update data source via SQL execution', async () => {
      const mockResult = { success: true, rowsAffected: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const dataSourceData = { id: 1, name: 'Updated Source' };
      const result = await databaseService.updateDataSource(dataSourceData);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE data_sources'),
        expect.arrayContaining(['Updated Source', 1])
      );
    });

    it('should handle updateDataSource errors', async () => {
      const error = new Error('Failed to update data source');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      const dataSourceData = { id: 1, name: 'Updated Source' };

      await expect(databaseService.updateDataSource(dataSourceData)).rejects.toThrow('Failed to update data source');
    });
  });

  describe('deleteDataSource', () => {
    it('should delete data source via SQL execution', async () => {
      const mockResult = { success: true, rowsAffected: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const result = await databaseService.deleteDataSource(1);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM data_sources'),
        [1]
      );
    });

    it('should handle deleteDataSource errors', async () => {
      const error = new Error('Failed to delete data source');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      await expect(databaseService.deleteDataSource(1)).rejects.toThrow('Failed to delete data source');
    });
  });

  describe('createSnapshot', () => {
    it('should create snapshot via SQL execution', async () => {
      const mockResult = { success: true, insertId: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const snapshotData = { 
        name: 'New Snapshot', 
        projectId: 1,
        description: 'Test snapshot'
      };
      const result = await databaseService.createSnapshot(snapshotData);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO snapshots'),
        expect.arrayContaining(['New Snapshot', 1, 'Test snapshot'])
      );
    });

    it('should handle createSnapshot errors', async () => {
      const error = new Error('Failed to create snapshot');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      const snapshotData = { name: 'New Snapshot', projectId: 1 };

      await expect(databaseService.createSnapshot(snapshotData)).rejects.toThrow('Failed to create snapshot');
    });
  });

  describe('getSnapshotData', () => {
    it('should get snapshot data via SQL query', async () => {
      const mockData = [
        { id: 1, name: 'Record 1' },
        { id: 2, name: 'Record 2' }
      ];
      mockElectronAPI.querySQL.mockResolvedValueOnce(mockData);

      const result = await databaseService.getSnapshotData(1);

      expect(result).toEqual(mockData);
      expect(mockElectronAPI.querySQL).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM snapshot_data'),
        [1]
      );
    });

    it('should handle getSnapshotData errors', async () => {
      const error = new Error('Failed to get snapshot data');
      mockElectronAPI.querySQL.mockRejectedValueOnce(error);

      await expect(databaseService.getSnapshotData(1)).rejects.toThrow('Failed to get snapshot data');
    });
  });

  describe('deleteSnapshot', () => {
    it('should delete snapshot via SQL execution', async () => {
      const mockResult = { success: true, rowsAffected: 1 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const result = await databaseService.deleteSnapshot(1);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM snapshots'),
        [1]
      );
    });

    it('should handle deleteSnapshot errors', async () => {
      const error = new Error('Failed to delete snapshot');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      await expect(databaseService.deleteSnapshot(1)).rejects.toThrow('Failed to delete snapshot');
    });
  });

  describe('getProjectById', () => {
    it('should get project by ID via SQL query', async () => {
      const mockProject = { id: 1, name: 'Test Project' };
      mockElectronAPI.querySQL.mockResolvedValueOnce([mockProject]);

      const result = await databaseService.getProjectById(1);

      expect(result).toEqual(mockProject);
      expect(mockElectronAPI.querySQL).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM projects WHERE id = ?'),
        [1]
      );
    });

    it('should handle project not found', async () => {
      mockElectronAPI.querySQL.mockResolvedValueOnce([]);

      const result = await databaseService.getProjectById(999);

      expect(result).toBeNull();
    });

    it('should handle getProjectById errors', async () => {
      const error = new Error('Failed to get project');
      mockElectronAPI.querySQL.mockRejectedValueOnce(error);

      await expect(databaseService.getProjectById(1)).rejects.toThrow('Failed to get project');
    });
  });

  describe('getDataSourceById', () => {
    it('should get data source by ID via SQL query', async () => {
      const mockDataSource = { id: 1, name: 'Test Source', type: 'mysql' };
      mockElectronAPI.querySQL.mockResolvedValueOnce([mockDataSource]);

      const result = await databaseService.getDataSourceById(1);

      expect(result).toEqual(mockDataSource);
      expect(mockElectronAPI.querySQL).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM data_sources WHERE id = ?'),
        [1]
      );
    });

    it('should handle data source not found', async () => {
      mockElectronAPI.querySQL.mockResolvedValueOnce([]);

      const result = await databaseService.getDataSourceById(999);

      expect(result).toBeNull();
    });

    it('should handle getDataSourceById errors', async () => {
      const error = new Error('Failed to get data source');
      mockElectronAPI.querySQL.mockRejectedValueOnce(error);

      await expect(databaseService.getDataSourceById(1)).rejects.toThrow('Failed to get data source');
    });
  });

  describe('getSnapshotsByProjectId', () => {
    it('should get snapshots by project ID via SQL query', async () => {
      const mockSnapshots = [
        { id: 1, name: 'Snapshot 1', projectId: 1 },
        { id: 2, name: 'Snapshot 2', projectId: 1 }
      ];
      mockElectronAPI.querySQL.mockResolvedValueOnce(mockSnapshots);

      const result = await databaseService.getSnapshotsByProjectId(1);

      expect(result).toEqual(mockSnapshots);
      expect(mockElectronAPI.querySQL).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM snapshots WHERE project_id = ?'),
        [1]
      );
    });

    it('should handle getSnapshotsByProjectId errors', async () => {
      const error = new Error('Failed to get snapshots');
      mockElectronAPI.querySQL.mockRejectedValueOnce(error);

      await expect(databaseService.getSnapshotsByProjectId(1)).rejects.toThrow('Failed to get snapshots');
    });
  });

  describe('executeBatch', () => {
    it('should execute batch of SQL statements', async () => {
      const mockResult = { success: true, rowsAffected: 2 };
      mockElectronAPI.executeSQL.mockResolvedValueOnce(mockResult);

      const statements = [
        'INSERT INTO test VALUES (1)',
        'INSERT INTO test VALUES (2)'
      ];

      const result = await databaseService.executeBatch(statements);

      expect(result).toEqual(mockResult);
      expect(mockElectronAPI.executeSQL).toHaveBeenCalledWith(
        expect.stringContaining('BEGIN TRANSACTION')
      );
    });

    it('should handle batch execution errors', async () => {
      const error = new Error('Batch execution failed');
      mockElectronAPI.executeSQL.mockRejectedValueOnce(error);

      const statements = ['INVALID SQL'];

      await expect(databaseService.executeBatch(statements)).rejects.toThrow('Batch execution failed');
    });
  });

  describe('getTableSchema', () => {
    it('should get table schema via SQL query', async () => {
      const mockSchema = [
        { column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' },
        { column_name: 'name', data_type: 'TEXT', is_nullable: 'YES' }
      ];
      mockElectronAPI.querySQL.mockResolvedValueOnce(mockSchema);

      const result = await databaseService.getTableSchema('test_table');

      expect(result).toEqual(mockSchema);
      expect(mockElectronAPI.querySQL).toHaveBeenCalledWith(
        expect.stringContaining('PRAGMA table_info'),
        ['test_table']
      );
    });

    it('should handle getTableSchema errors', async () => {
      const error = new Error('Failed to get table schema');
      mockElectronAPI.querySQL.mockRejectedValueOnce(error);

      await expect(databaseService.getTableSchema('test_table')).rejects.toThrow('Failed to get table schema');
    });
  });

  describe('getDatabaseStats', () => {
    it('should get database statistics', async () => {
      const mockStats = {
        totalProjects: 5,
        totalDataSources: 10,
        totalSnapshots: 25,
        totalSize: '100MB'
      };

      // Mock multiple query calls
      mockElectronAPI.querySQL
        .mockResolvedValueOnce([{ count: 5 }]) // projects count
        .mockResolvedValueOnce([{ count: 10 }]) // data sources count
        .mockResolvedValueOnce([{ count: 25 }]); // snapshots count

      const result = await databaseService.getDatabaseStats();

      expect(result.totalProjects).toBe(5);
      expect(result.totalDataSources).toBe(10);
      expect(result.totalSnapshots).toBe(25);
    });

    it('should handle getDatabaseStats errors', async () => {
      const error = new Error('Failed to get database stats');
      mockElectronAPI.querySQL.mockRejectedValueOnce(error);

      await expect(databaseService.getDatabaseStats()).rejects.toThrow('Failed to get database stats');
    });
  });
});
