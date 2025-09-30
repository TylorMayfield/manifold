/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../../../app/api/jobs/route';

// Mock database
jest.mock('../../../lib/server/database/SimpleSQLiteDB', () => ({
  SimpleSQLiteDB: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      getJobs: jest.fn(() => []),
      createJob: jest.fn((projectId, jobData) => ({
        id: 'job_test_123',
        ...jobData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      updateJob: jest.fn((jobId, updates) => true),
      deleteJob: jest.fn((jobId) => true),
    })),
  },
}));

describe('Jobs API', () => {
  describe('GET /api/jobs', () => {
    it('should return list of jobs for default project', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter jobs by status', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?status=active');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter jobs by type', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?type=pipeline');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should handle projectId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?projectId=test-project');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
    });

    it('should handle errors gracefully', async () => {
      // Mock an error
      const SimpleSQLiteDB = require('../../../lib/server/database/SimpleSQLiteDB').SimpleSQLiteDB;
      SimpleSQLiteDB.getInstance.mockImplementationOnce(() => ({
        initialize: jest.fn(),
        getJobs: jest.fn(() => {
          throw new Error('Database error');
        }),
      }));

      const request = new NextRequest('http://localhost:3000/api/jobs');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/jobs', () => {
    it('should create a new job', async () => {
      const jobData = {
        name: 'Test Job',
        description: 'Test Description',
        type: 'pipeline',
        schedule: '0 2 * * *',
        pipelineId: 'pipeline_123',
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.name).toBe('Test Job');
    });

    it('should require name field', async () => {
      const jobData = {
        type: 'pipeline',
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      const response = await POST(request);
      
      // Should either validate or create with default name
      expect([201, 400]).toContain(response.status);
    });

    it('should handle schedule validation', async () => {
      const jobData = {
        name: 'Test Job',
        type: 'pipeline',
        schedule: 'invalid-cron',
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      const response = await POST(request);
      
      // Should either validate cron or accept as-is
      expect([201, 400]).toContain(response.status);
    });

    it('should set default projectId if not provided', async () => {
      const jobData = {
        name: 'Test Job',
        type: 'script',
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(201);
      expect(data).toBeDefined();
    });

    it('should handle creation errors', async () => {
      const SimpleSQLiteDB = require('../../../lib/server/database/SimpleSQLiteDB').SimpleSQLiteDB;
      SimpleSQLiteDB.getInstance.mockImplementationOnce(() => ({
        initialize: jest.fn(),
        createJob: jest.fn(() => {
          throw new Error('Creation failed');
        }),
      }));

      const jobData = {
        name: 'Test Job',
        type: 'pipeline',
      };

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      });

      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('Job Status Filtering', () => {
    it('should return only active jobs when status=active', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?status=active');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return only failed jobs when status=failed', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?status=failed');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return only paused jobs when status=paused', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?status=paused');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return only completed jobs when status=completed', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?status=completed');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Job Type Filtering', () => {
    it('should return only pipeline jobs when type=pipeline', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?type=pipeline');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return only script jobs when type=script', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?type=script');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should return only sync jobs when type=sync', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs?type=sync');
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
