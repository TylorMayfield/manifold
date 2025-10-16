/**
 * @jest-environment jsdom
 */

import { MongoDatabase } from '../../../lib/server/database/MongoDatabase';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  connection: {
    readyState: 1,
    db: {
      admin: jest.fn(() => ({
        command: jest.fn()
      }))
    }
  },
  Schema: jest.fn(),
  model: jest.fn()
}));

describe('MongoDatabase', () => {
  let mongoDatabase: MongoDatabase;

  beforeEach(() => {
    jest.clearAllMocks();
    mongoDatabase = MongoDatabase.getInstance();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MongoDatabase.getInstance();
      const instance2 = MongoDatabase.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('should initialize database connection', async () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockResolvedValueOnce(undefined);

      await mongoDatabase.initialize();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        expect.stringContaining('mongodb://'),
        expect.any(Object)
      );
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      const mockMongoose = require('mongoose');
      mockMongoose.connect.mockRejectedValueOnce(error);

      await expect(mongoDatabase.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('isHealthy', () => {
    it('should return true when connection is ready', () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connection.readyState = 1; // Connected

      const result = mongoDatabase.isHealthy();

      expect(result).toBe(true);
    });

    it('should return false when connection is not ready', () => {
      const mockMongoose = require('mongoose');
      mockMongoose.connection.readyState = 0; // Disconnected

      const result = mongoDatabase.isHealthy();

      expect(result).toBe(false);
    });
  });

  describe('getProjects', () => {
    it('should return projects from database', async () => {
      const mockProjects = [
        { _id: '1', name: 'Project 1', description: 'Test project 1' },
        { _id: '2', name: 'Project 2', description: 'Test project 2' }
      ];

      const mockModelInstance = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockProjects)
        })
      };

      const mockMongoose = require('mongoose');
      mockMongoose.model.mockReturnValue(mockModelInstance);

      const result = await mongoDatabase.getProjects();

      expect(result).toEqual(mockProjects);
      expect(mockModelInstance.find).toHaveBeenCalledWith({});
      expect(mockMongoose.model).toHaveBeenCalledWith('Project', expect.any(Object));
    });

    it('should handle database errors', async () => {
      const mockModelInstance = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      };

      const mockMongoose = require('mongoose');
      mockMongoose.model.mockReturnValue(mockModelInstance);

      await expect(mongoDatabase.getProjects()).rejects.toThrow('Database error');
    });
  });

  describe('getDataSources', () => {
    it('should return data sources from database', async () => {
      const mockDataSources = [
        { _id: '1', name: 'MySQL Source', type: 'mysql' },
        { _id: '2', name: 'PostgreSQL Source', type: 'postgresql' }
      ];

      const mockModelInstance = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockDataSources)
        })
      };

      const mockMongoose = require('mongoose');
      mockMongoose.model.mockReturnValue(mockModelInstance);

      const result = await mongoDatabase.getDataSources();

      expect(result).toEqual(mockDataSources);
      expect(mockModelInstance.find).toHaveBeenCalledWith({});
      expect(mockMongoose.model).toHaveBeenCalledWith('DataSource', expect.any(Object));
    });

    it('should filter data sources by project ID', async () => {
      const mockDataSources = [
        { _id: '1', name: 'Source 1', projectId: 'project1' }
      ];

      const mockModelInstance = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockDataSources)
        })
      };

      const mockMongoose = require('mongoose');
      mockMongoose.model.mockReturnValue(mockModelInstance);

      const result = await mongoDatabase.getDataSources('project1');

      expect(result).toEqual(mockDataSources);
      expect(mockModelInstance.find).toHaveBeenCalledWith({ projectId: 'project1' });
    });
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'New Project',
        description: 'Test project',
        projectId: 'test-project'
      };

      const mockCreatedProject = { _id: '1', ...projectData };

      const mockModelInstance = {
        create: jest.fn().mockResolvedValue(mockCreatedProject)
      };

      const mockMongoose = require('mongoose');
      mockMongoose.model.mockReturnValue(mockModelInstance);

      const result = await mongoDatabase.createProject(projectData);

      expect(result).toEqual(mockCreatedProject);
      expect(mockModelInstance.create).toHaveBeenCalledWith(projectData);
    });

    it('should handle creation errors', async () => {
      const projectData = { name: 'New Project' };

      const mockModelInstance = {
        create: jest.fn().mockRejectedValue(new Error('Creation failed'))
      };

      const mockMongoose = require('mongoose');
      mockMongoose.model.mockReturnValue(mockModelInstance);

      await expect(mongoDatabase.createProject(projectData)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const projectId = '1';
      const updateData = { name: 'Updated Project' };

      const mockUpdatedProject = { _id: projectId, ...updateData };

      const mockModelInstance = {
        findByIdAndUpdate: jest.fn().mockResolvedValue(mockUpdatedProject)
      };

      const mockMongoose = require('mongoose');
      mockMongoose.model.mockReturnValue(mockModelInstance);

      const result = await mongoDatabase.updateProject(projectId, updateData);

      expect(result).toEqual(mockUpdatedProject);
      expect(mockModelInstance.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updateData,
        { new: true }
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const projectId = '1';

      const mockModelInstance = {
        findByIdAndDelete: jest.fn().mockResolvedValue({ _id: projectId })
      };

      const mockMongoose = require('mongoose');
      mockMongoose.model.mockReturnValue(mockModelInstance);

      const result = await mongoDatabase.deleteProject(projectId);

      expect(result).toEqual({ _id: projectId });
      expect(mockModelInstance.findByIdAndDelete).toHaveBeenCalledWith(projectId);
    });
  });
});
