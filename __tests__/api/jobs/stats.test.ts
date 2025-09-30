/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET } from '../../../app/api/jobs/stats/route';

// Mock CoreDatabase
jest.mock('../../../lib/server/database/CoreDatabase', () => ({
  CoreDatabase: {
    getInstance: jest.fn(() => ({
      getProjects: jest.fn(async () => [
        {
          id: 'proj1',
          name: 'Test Project',
          createdAt: new Date('2025-09-25T00:00:00Z'),
          updatedAt: new Date(),
          description: 'Test',
          dataPath: './data/projects/proj1',
        }
      ]),
    })),
  },
}));

// Mock SeparatedDatabaseManager
jest.mock('../../../lib/database/SeparatedDatabaseManager', () => ({
  SeparatedDatabaseManager: {
    getInstance: jest.fn(() => ({
      getDataSources: jest.fn(async () => [
        { id: 'ds1', name: 'Test Source', type: 'csv' },
        { id: 'ds2', name: 'Test Source 2', type: 'json' }
      ]),
    })),
  },
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  statSync: jest.fn(() => ({ size: 1024 * 1024 })), // 1 MB
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
      const CoreDatabase = require('../../../lib/server/database/CoreDatabase').CoreDatabase;
      CoreDatabase.getInstance.mockImplementationOnce(() => ({
        getProjects: jest.fn(async () => {
          throw new Error('Database error');
        }),
      }));

      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should return default values when no projects exist', async () => {
      const CoreDatabase = require('../../../lib/server/database/CoreDatabase').CoreDatabase;
      CoreDatabase.getInstance.mockImplementationOnce(() => ({
        getProjects: jest.fn(async () => []),
      }));

      const SeparatedDatabaseManager = require('../../../lib/database/SeparatedDatabaseManager').SeparatedDatabaseManager;
      SeparatedDatabaseManager.getInstance.mockImplementationOnce(() => ({
        getDataSources: jest.fn(async () => []),
      }));

      const response = await GET();
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.stats.totalJobs).toBe(0);
      expect(data.systemStats.dataSources).toBe(0);
      expect(data.systemStats.uptime).toBe('0m');
    });

    it('should handle missing data sources gracefully', async () => {
      const SeparatedDatabaseManager = require('../../../lib/database/SeparatedDatabaseManager').SeparatedDatabaseManager;
      SeparatedDatabaseManager.getInstance.mockImplementationOnce(() => ({
        getDataSources: jest.fn(async () => {
          throw new Error('No data sources');
        }),
      }));

      const response = await GET();
      const data = await response.json();
      
      // Should still return valid response with 0 data sources
      expect(response.status).toBe(200);
    });
  });

  describe('Storage Calculation', () => {
    it('should sum storage from all data source databases', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.storageUsed).toBeDefined();
      // With 2 data sources at 1 MB each = 2 MB
      expect(data.systemStats.storageUsed).toContain('MB');
    });

    it('should handle missing database files', async () => {
      const fs = require('fs');
      fs.existsSync.mockReturnValueOnce(false);

      const response = await GET();
      const data = await response.json();
      
      // Should still return a valid storage value
      expect(data.systemStats.storageUsed).toBeDefined();
    });
  });

  describe('Uptime Calculation', () => {
    it('should calculate uptime from oldest project', async () => {
      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.uptime).toBeDefined();
      // With project created 5 days ago
      expect(data.systemStats.uptime).toMatch(/\d+d/); // Should show days
    });

    it('should show hours when less than a day', async () => {
      const CoreDatabase = require('../../../lib/server/database/CoreDatabase').CoreDatabase;
      const now = new Date();
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      
      CoreDatabase.getInstance.mockImplementationOnce(() => ({
        getProjects: jest.fn(async () => [
          {
            id: 'proj1',
            name: 'Recent Project',
            createdAt: sixHoursAgo,
            updatedAt: now,
            description: 'Test',
            dataPath: './data/projects/proj1',
          }
        ]),
      }));

      const response = await GET();
      const data = await response.json();
      
      expect(data.systemStats.uptime).toMatch(/\d+h/); // Should show hours
    });
  });
});
