/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../../../app/api/jobs/stats/route';

// Mock MongoDatabase
jest.mock('../../../lib/server/database/MongoDatabase', () => ({
  MongoDatabase: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      isHealthy: jest.fn(() => true),
      getProjects: jest.fn(async () => [
        {
          _id: 'proj1',
          name: 'Test Project',
          createdAt: new Date('2025-09-25T00:00:00Z'),
          updatedAt: new Date(),
          description: 'Test',
          dataPath: './data/projects/proj1',
        }
      ]),
      getDataSources: jest.fn(async () => [
        { id: 'ds1', name: 'Test Source', type: 'csv' },
        { id: 'ds2', name: 'Test Source 2', type: 'json' }
      ]),
      getJobs: jest.fn(async () => []),
      getPipelines: jest.fn(async () => []),
      getSnapshots: jest.fn(async () => []),
      createJob: jest.fn(),
      updateJob: jest.fn(),
    })),
  },
}));

// Mock mongoose for dbStats
jest.mock('mongoose', () => ({
  connection: {
    db: {
      admin: jest.fn(() => ({
        command: jest.fn(async () => ({ dataSize: 1024 * 1024 })) // 1 MB
      }))
    }
  }
}));

describe('Jobs Stats API', () => {
  describe('GET /api/jobs/stats', () => {
    it('should return job statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/stats');
      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('systemStats');
    });

    it('should return stats object with correct structure', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.stats).toHaveProperty('totalJobs');
      expect(data.stats).toHaveProperty('completedToday');
      expect(data.stats).toHaveProperty('failedToday');
      expect(data.stats).toHaveProperty('successRate');
    });

    it('should return system stats', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats).toHaveProperty('dataSources');
      expect(data.systemStats).toHaveProperty('activePipelines');
      expect(data.systemStats).toHaveProperty('storageUsed');
      expect(data.systemStats).toHaveProperty('uptime');
    });

    it('should calculate data sources count correctly', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.dataSources).toBe(2); // 2 mocked data sources
    });

    it('should format storage size correctly', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.storageUsed).toBeDefined();
      expect(typeof data.systemStats.storageUsed).toBe('string');
      expect(data.systemStats.storageUsed).toMatch(/\d+(\.\d+)?\s+(B|KB|MB|GB)/);
    });

    it('should calculate uptime correctly', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.uptime).toBeDefined();
      expect(typeof data.systemStats.uptime).toBe('string');
      // Should show time format like "5d 12h" or "12h" or "30m"
      expect(data.systemStats.uptime).toMatch(/\d+(d|h|m)/);
    });

    it('should return totalJobs based on projects', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.stats.totalJobs).toBeGreaterThanOrEqual(0);
      expect(typeof data.stats.totalJobs).toBe('number');
    });

    it('should return successRate as a percentage', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.stats.successRate).toBeGreaterThanOrEqual(0);
      expect(data.stats.successRate).toBeLessThanOrEqual(100);
    });

    it('should handle database errors gracefully', async () => {
      const MongoDatabase = require('../../../lib/server/database/MongoDatabase').MongoDatabase;
      MongoDatabase.getInstance.mockImplementationOnce(() => ({
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getProjects: jest.fn(async () => {
          throw new Error('Database error');
        }),
        getDataSources: jest.fn(async () => []),
        getJobs: jest.fn(async () => []),
        getPipelines: jest.fn(async () => []),
        getSnapshots: jest.fn(async () => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }));

      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should return default values when no projects exist', async () => {
      const MongoDatabase = require('../../../lib/server/database/MongoDatabase').MongoDatabase;
      MongoDatabase.getInstance.mockImplementationOnce(() => ({
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getProjects: jest.fn(async () => []),
        getDataSources: jest.fn(async () => []),
        getJobs: jest.fn(async () => []),
        getPipelines: jest.fn(async () => []),
        getSnapshots: jest.fn(async () => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }));

      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.stats.totalJobs).toBe(0);
      expect(data.systemStats.dataSources).toBe(0);
      expect(data.systemStats.uptime).toBe('0m');
    });

    it('should handle database not ready gracefully', async () => {
      const MongoDatabase = require('../../../lib/server/database/MongoDatabase').MongoDatabase;
      MongoDatabase.getInstance.mockImplementationOnce(() => ({
        initialize: jest.fn(),
        isHealthy: jest.fn(() => false), // Database not healthy
        getProjects: jest.fn(async () => []),
        getDataSources: jest.fn(async () => []),
        getJobs: jest.fn(async () => []),
        getPipelines: jest.fn(async () => []),
        getSnapshots: jest.fn(async () => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }));

      const response = await GET();
      const data = await response.json();
      
      // Should return default stats when database not ready
      expect(response.status).toBe(200);
      expect(data.stats.totalJobs).toBe(0);
      expect(data.systemStats.dataSources).toBe(0);
    });
  });

  describe('Storage Calculation', () => {
    it('should get storage from MongoDB stats', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.storageUsed).toBeDefined();
      expect(typeof data.systemStats.storageUsed).toBe('string');
      expect(data.systemStats.storageUsed).toMatch(/\d+(\.\d+)?\s+(B|KB|MB|GB)/);
    });

    it('should handle storage calculation errors', async () => {
      const mongoose = require('mongoose');
      mongoose.connection.db.admin.mockImplementationOnce(() => ({
        command: jest.fn(async () => {
          throw new Error('Stats error');
        })
      }));

      const response = await GET();
      const data = await response.json();
      
      // Should still return a valid response
      expect(response.status).toBe(200);
      expect(data.systemStats).toBeDefined();
    });
  });

  describe('Uptime Calculation', () => {
    it('should calculate uptime from oldest project', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.uptime).toBeDefined();
      // With project created in September, should show days
      expect(data.systemStats.uptime).toMatch(/\d+(d|h|m)/);
    });

    it('should show hours when less than a day', async () => {
      const MongoDatabase = require('../../../lib/server/database/MongoDatabase').MongoDatabase;
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      
      MongoDatabase.getInstance.mockImplementationOnce(() => ({
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getProjects: jest.fn(async () => [
          {
            _id: 'proj1',
            name: 'Recent Project',
            createdAt: sixHoursAgo,
            updatedAt: now,
            description: 'Test',
            dataPath: './data/projects/proj1',
          }
        ]),
        getDataSources: jest.fn(async () => []),
        getJobs: jest.fn(async () => []),
        getPipelines: jest.fn(async () => []),
        getSnapshots: jest.fn(async () => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }));

      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.uptime).toMatch(/\d+h/); // Should show hours
    });
  });
});

