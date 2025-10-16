/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../../../app/api/data-sources/route';

// Mock MongoDatabase
jest.mock('../../../lib/server/database/MongoDatabase');
const mockMongoDatabase = require('../../../lib/server/database/MongoDatabase');

// Mock ensureDb
jest.mock('../../../lib/server/database', () => ({
  ensureDb: jest.fn()
}));

const mockEnsureDb = require('../../../lib/server/database').ensureDb;

describe('/api/data-sources', () => {
  let mockDatabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDatabase = {
      isHealthy: jest.fn().mockReturnValue(true),
      getDataSources: jest.fn(),
      createDataSource: jest.fn(),
      updateDataSource: jest.fn(),
      deleteDataSource: jest.fn(),
      getDataSourceById: jest.fn()
    };

    mockEnsureDb.mockResolvedValue(mockDatabase);
  });

  describe('GET', () => {
    it('should return data sources successfully', async () => {
      const mockDataSources = [
        { _id: '1', name: 'MySQL Source', type: 'mysql', connectionString: 'mysql://localhost:3306/test' },
        { _id: '2', name: 'PostgreSQL Source', type: 'postgresql', connectionString: 'postgresql://localhost:5432/test' }
      ];

      mockDatabase.getDataSources.mockResolvedValue(mockDataSources);

      const request = new NextRequest('http://localhost:3000/api/data-sources');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockDataSources);
      expect(mockDatabase.getDataSources).toHaveBeenCalled();
    });

    it('should handle database not ready', async () => {
      mockDatabase.isHealthy.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/data-sources');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database not ready');
    });

    it('should handle database errors', async () => {
      mockDatabase.getDataSources.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/data-sources');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Database connection failed');
    });

    it('should filter data sources by type', async () => {
      const mockDataSources = [
        { _id: '1', name: 'MySQL Source', type: 'mysql' },
        { _id: '2', name: 'PostgreSQL Source', type: 'postgresql' }
      ];

      mockDatabase.getDataSources.mockResolvedValue(mockDataSources);

      const request = new NextRequest('http://localhost:3000/api/data-sources?type=mysql');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockDataSources[0]]);
    });

    it('should filter data sources by project', async () => {
      const mockDataSources = [
        { _id: '1', name: 'Source 1', projectId: 'project1' },
        { _id: '2', name: 'Source 2', projectId: 'project2' }
      ];

      mockDatabase.getDataSources.mockResolvedValue(mockDataSources);

      const request = new NextRequest('http://localhost:3000/api/data-sources?projectId=project1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockDataSources[0]]);
    });
  });

  describe('POST', () => {
    it('should create data source successfully', async () => {
      const dataSourceData = {
        name: 'New MySQL Source',
        type: 'mysql',
        connectionString: 'mysql://localhost:3306/test',
        projectId: 'project1'
      };

      const createdDataSource = { _id: 'new-id', ...dataSourceData };
      mockDatabase.createDataSource.mockResolvedValue(createdDataSource);

      const request = new NextRequest('http://localhost:3000/api/data-sources', {
        method: 'POST',
        body: JSON.stringify(dataSourceData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(createdDataSource);
      expect(mockDatabase.createDataSource).toHaveBeenCalledWith(dataSourceData);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        type: 'mysql'
        // Missing name and connectionString
      };

      const request = new NextRequest('http://localhost:3000/api/data-sources', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Name is required');
    });

    it('should validate data source type', async () => {
      const invalidData = {
        name: 'Test Source',
        type: 'invalid-type',
        connectionString: 'test://localhost'
      };

      const request = new NextRequest('http://localhost:3000/api/data-sources', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid data source type');
    });

    it('should handle database not ready', async () => {
      mockDatabase.isHealthy.mockReturnValue(false);

      const dataSourceData = {
        name: 'Test Source',
        type: 'mysql',
        connectionString: 'mysql://localhost:3306/test'
      };

      const request = new NextRequest('http://localhost:3000/api/data-sources', {
        method: 'POST',
        body: JSON.stringify(dataSourceData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database not ready');
    });

    it('should handle creation errors', async () => {
      const dataSourceData = {
        name: 'Test Source',
        type: 'mysql',
        connectionString: 'mysql://localhost:3306/test'
      };

      mockDatabase.createDataSource.mockRejectedValue(new Error('Creation failed'));

      const request = new NextRequest('http://localhost:3000/api/data-sources', {
        method: 'POST',
        body: JSON.stringify(dataSourceData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Creation failed');
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-sources', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });
  });

  describe('PUT', () => {
    it('should update data source successfully', async () => {
      const dataSourceId = 'source1';
      const updateData = {
        name: 'Updated Source',
        connectionString: 'mysql://localhost:3306/updated'
      };

      const updatedDataSource = { _id: dataSourceId, ...updateData };
      mockDatabase.updateDataSource.mockResolvedValue(updatedDataSource);

      const request = new NextRequest(`http://localhost:3000/api/data-sources?id=${dataSourceId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedDataSource);
      expect(mockDatabase.updateDataSource).toHaveBeenCalledWith(dataSourceId, updateData);
    });

    it('should require data source ID', async () => {
      const updateData = { name: 'Updated Source' };

      const request = new NextRequest('http://localhost:3000/api/data-sources', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Data source ID is required');
    });

    it('should handle update errors', async () => {
      const dataSourceId = 'source1';
      const updateData = { name: 'Updated Source' };

      mockDatabase.updateDataSource.mockRejectedValue(new Error('Update failed'));

      const request = new NextRequest(`http://localhost:3000/api/data-sources?id=${dataSourceId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Update failed');
    });
  });

  describe('DELETE', () => {
    it('should delete data source successfully', async () => {
      const dataSourceId = 'source1';
      mockDatabase.deleteDataSource.mockResolvedValue({ success: true });

      const request = new NextRequest(`http://localhost:3000/api/data-sources?id=${dataSourceId}`, {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDatabase.deleteDataSource).toHaveBeenCalledWith(dataSourceId);
    });

    it('should require data source ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-sources', {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Data source ID is required');
    });

    it('should handle deletion errors', async () => {
      const dataSourceId = 'source1';
      mockDatabase.deleteDataSource.mockRejectedValue(new Error('Deletion failed'));

      const request = new NextRequest(`http://localhost:3000/api/data-sources?id=${dataSourceId}`, {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Deletion failed');
    });
  });
});
