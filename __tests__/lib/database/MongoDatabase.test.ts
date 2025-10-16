/**
 * @jest-environment node
 */

import { MongoDatabase } from '../../../lib/server/database/MongoDatabase';

// Mock mongoose
const mockConnect = jest.fn();
const mockSchema = jest.fn(() => ({
  methods: {},
  statics: {},
  pre: jest.fn(),
  post: jest.fn()
}));
const mockModel = jest.fn();

jest.mock('mongoose', () => ({
  connect: mockConnect,
  connection: {
    readyState: 1,
    db: {
      admin: jest.fn(() => ({
        command: jest.fn()
      }))
    }
  },
  Schema: mockSchema,
  model: mockModel
}));

const mockMongoose = require('mongoose');

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
      mockConnect.mockResolvedValueOnce(undefined);

      await mongoDatabase.initialize();

      expect(mockConnect).toHaveBeenCalledWith(
        expect.stringContaining('mongodb://'),
        expect.any(Object)
      );
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockMongoose.connect.mockRejectedValueOnce(error);

      await expect(mongoDatabase.initialize()).rejects.toThrow('Connection failed');
    });

    it('should use default connection string when none provided', async () => {
      mockMongoose.connect.mockResolvedValueOnce(undefined);

      await mongoDatabase.initialize();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        expect.stringContaining('mongodb://localhost:27017'),
        expect.any(Object)
      );
    });

    it('should use custom connection string when provided', async () => {
      mockMongoose.connect.mockResolvedValueOnce(undefined);

      await mongoDatabase.initialize('mongodb://custom:27017/test');

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://custom:27017/test',
        expect.any(Object)
      );
    });
  });

  describe('isHealthy', () => {
    it('should return true when connection is ready', () => {
      mockMongoose.connection.readyState = 1; // Connected

      const result = mongoDatabase.isHealthy();

      expect(result).toBe(true);
    });

    it('should return false when connection is not ready', () => {
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

      const mockModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockProjects)
        })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getProjects();

      expect(result).toEqual(mockProjects);
      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockMongoose.model).toHaveBeenCalledWith('Project', expect.any(Object));
    });

    it('should handle database errors', async () => {
      const mockModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      await expect(mongoDatabase.getProjects()).rejects.toThrow('Database error');
    });
  });

  describe('getDataSources', () => {
    it('should return data sources from database', async () => {
      const mockDataSources = [
        { _id: '1', name: 'MySQL Source', type: 'mysql' },
        { _id: '2', name: 'PostgreSQL Source', type: 'postgresql' }
      ];

      const mockModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockDataSources)
        })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getDataSources();

      expect(result).toEqual(mockDataSources);
      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockMongoose.model).toHaveBeenCalledWith('DataSource', expect.any(Object));
    });

    it('should filter data sources by project ID', async () => {
      const mockDataSources = [
        { _id: '1', name: 'Source 1', projectId: 'project1' }
      ];

      const mockModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockDataSources)
        })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getDataSources('project1');

      expect(result).toEqual(mockDataSources);
      expect(mockModel.find).toHaveBeenCalledWith({ projectId: 'project1' });
    });
  });

  describe('getJobs', () => {
    it('should return jobs from database', async () => {
      const mockJobs = [
        { _id: '1', name: 'Backup Job', type: 'backup', status: 'completed' },
        { _id: '2', name: 'Integrity Check', type: 'integrity_check', status: 'running' }
      ];

      const mockModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockJobs)
        })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getJobs();

      expect(result).toEqual(mockJobs);
      expect(mockModel.find).toHaveBeenCalledWith({});
      expect(mockMongoose.model).toHaveBeenCalledWith('Job', expect.any(Object));
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

      const mockModel = {
        create: jest.fn().mockResolvedValue(mockCreatedProject)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.createProject(projectData);

      expect(result).toEqual(mockCreatedProject);
      expect(mockModel.create).toHaveBeenCalledWith(projectData);
    });

    it('should handle creation errors', async () => {
      const projectData = { name: 'New Project' };

      const mockModel = {
        create: jest.fn().mockRejectedValue(new Error('Creation failed'))
      };

      mockMongoose.model.mockReturnValue(mockModel);

      await expect(mongoDatabase.createProject(projectData)).rejects.toThrow('Creation failed');
    });
  });

  describe('createDataSource', () => {
    it('should create a new data source', async () => {
      const dataSourceData = {
        name: 'New Data Source',
        type: 'mysql',
        connectionString: 'mysql://localhost:3306/test',
        projectId: 'project1'
      };

      const mockCreatedDataSource = { _id: '1', ...dataSourceData };

      const mockModel = {
        create: jest.fn().mockResolvedValue(mockCreatedDataSource)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.createDataSource(dataSourceData);

      expect(result).toEqual(mockCreatedDataSource);
      expect(mockModel.create).toHaveBeenCalledWith(dataSourceData);
    });
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      const jobData = {
        name: 'New Job',
        type: 'backup',
        schedule: '0 0 * * *',
        projectId: 'project1'
      };

      const mockCreatedJob = { _id: '1', ...jobData };

      const mockModel = {
        create: jest.fn().mockResolvedValue(mockCreatedJob)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.createJob(jobData);

      expect(result).toEqual(mockCreatedJob);
      expect(mockModel.create).toHaveBeenCalledWith(jobData);
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const projectId = '1';
      const updateData = { name: 'Updated Project' };

      const mockUpdatedProject = { _id: projectId, ...updateData };

      const mockModel = {
        findByIdAndUpdate: jest.fn().mockResolvedValue(mockUpdatedProject)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.updateProject(projectId, updateData);

      expect(result).toEqual(mockUpdatedProject);
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        projectId,
        updateData,
        { new: true }
      );
    });

    it('should handle update errors', async () => {
      const projectId = '1';
      const updateData = { name: 'Updated Project' };

      const mockModel = {
        findByIdAndUpdate: jest.fn().mockRejectedValue(new Error('Update failed'))
      };

      mockMongoose.model.mockReturnValue(mockModel);

      await expect(mongoDatabase.updateProject(projectId, updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('updateDataSource', () => {
    it('should update an existing data source', async () => {
      const dataSourceId = '1';
      const updateData = { name: 'Updated Data Source' };

      const mockUpdatedDataSource = { _id: dataSourceId, ...updateData };

      const mockModel = {
        findByIdAndUpdate: jest.fn().mockResolvedValue(mockUpdatedDataSource)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.updateDataSource(dataSourceId, updateData);

      expect(result).toEqual(mockUpdatedDataSource);
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        dataSourceId,
        updateData,
        { new: true }
      );
    });
  });

  describe('updateJob', () => {
    it('should update an existing job', async () => {
      const jobId = '1';
      const updateData = { status: 'completed', lastRun: new Date() };

      const mockUpdatedJob = { _id: jobId, ...updateData };

      const mockModel = {
        findByIdAndUpdate: jest.fn().mockResolvedValue(mockUpdatedJob)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.updateJob(jobId, updateData);

      expect(result).toEqual(mockUpdatedJob);
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        jobId,
        updateData,
        { new: true }
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const projectId = '1';

      const mockModel = {
        findByIdAndDelete: jest.fn().mockResolvedValue({ _id: projectId })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.deleteProject(projectId);

      expect(result).toEqual({ _id: projectId });
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(projectId);
    });
  });

  describe('deleteDataSource', () => {
    it('should delete a data source', async () => {
      const dataSourceId = '1';

      const mockModel = {
        findByIdAndDelete: jest.fn().mockResolvedValue({ _id: dataSourceId })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.deleteDataSource(dataSourceId);

      expect(result).toEqual({ _id: dataSourceId });
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(dataSourceId);
    });
  });

  describe('deleteJob', () => {
    it('should delete a job', async () => {
      const jobId = '1';

      const mockModel = {
        findByIdAndDelete: jest.fn().mockResolvedValue({ _id: jobId })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.deleteJob(jobId);

      expect(result).toEqual({ _id: jobId });
      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith(jobId);
    });
  });

  describe('getProjectById', () => {
    it('should return a project by ID', async () => {
      const projectId = '1';
      const mockProject = { _id: projectId, name: 'Test Project' };

      const mockModel = {
        findById: jest.fn().mockResolvedValue(mockProject)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getProjectById(projectId);

      expect(result).toEqual(mockProject);
      expect(mockModel.findById).toHaveBeenCalledWith(projectId);
    });

    it('should return null if project not found', async () => {
      const projectId = 'nonexistent';

      const mockModel = {
        findById: jest.fn().mockResolvedValue(null)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getProjectById(projectId);

      expect(result).toBeNull();
    });
  });

  describe('getDataSourceById', () => {
    it('should return a data source by ID', async () => {
      const dataSourceId = '1';
      const mockDataSource = { _id: dataSourceId, name: 'Test Source' };

      const mockModel = {
        findById: jest.fn().mockResolvedValue(mockDataSource)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getDataSourceById(dataSourceId);

      expect(result).toEqual(mockDataSource);
      expect(mockModel.findById).toHaveBeenCalledWith(dataSourceId);
    });
  });

  describe('getJobById', () => {
    it('should return a job by ID', async () => {
      const jobId = '1';
      const mockJob = { _id: jobId, name: 'Test Job' };

      const mockModel = {
        findById: jest.fn().mockResolvedValue(mockJob)
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getJobById(jobId);

      expect(result).toEqual(mockJob);
      expect(mockModel.findById).toHaveBeenCalledWith(jobId);
    });
  });

  describe('getSnapshots', () => {
    it('should return snapshots from database', async () => {
      const mockSnapshots = [
        { _id: '1', name: 'Snapshot 1', projectId: 'project1' },
        { _id: '2', name: 'Snapshot 2', projectId: 'project1' }
      ];

      const mockModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSnapshots)
        })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getSnapshots();

      expect(result).toEqual(mockSnapshots);
      expect(mockModel.find).toHaveBeenCalledWith({});
    });

    it('should filter snapshots by project ID', async () => {
      const mockSnapshots = [
        { _id: '1', name: 'Snapshot 1', projectId: 'project1' }
      ];

      const mockModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockSnapshots)
        })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getSnapshots('project1');

      expect(result).toEqual(mockSnapshots);
      expect(mockModel.find).toHaveBeenCalledWith({ projectId: 'project1' });
    });
  });

  describe('getPipelines', () => {
    it('should return pipelines from database', async () => {
      const mockPipelines = [
        { _id: '1', name: 'Pipeline 1', projectId: 'project1' },
        { _id: '2', name: 'Pipeline 2', projectId: 'project1' }
      ];

      const mockModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockPipelines)
        })
      };

      mockMongoose.model.mockReturnValue(mockModel);

      const result = await mongoDatabase.getPipelines();

      expect(result).toEqual(mockPipelines);
      expect(mockModel.find).toHaveBeenCalledWith({});
    });
  });

  describe('getDatabaseStats', () => {
    it('should return database statistics', async () => {
      const mockStats = {
        dataSize: 1024 * 1024 * 10, // 10MB
        storageSize: 1024 * 1024 * 15, // 15MB
        indexSize: 1024 * 1024 * 5, // 5MB
        collections: 5,
        objects: 1000
      };

      mockMongoose.connection.db.admin().command.mockResolvedValueOnce({
        dataSize: mockStats.dataSize,
        storageSize: mockStats.storageSize,
        indexSize: mockStats.indexSize,
        collections: mockStats.collections,
        objects: mockStats.objects
      });

      // Mock countDocuments for different collections
      const mockModel = {
        countDocuments: jest.fn().mockResolvedValue(100)
      };

      mockMongoose.model
        .mockReturnValueOnce(mockModel) // Projects
        .mockReturnValueOnce(mockModel) // DataSources
        .mockReturnValueOnce(mockModel) // Jobs
        .mockReturnValueOnce(mockModel); // Snapshots

      const result = await mongoDatabase.getDatabaseStats();

      expect(result.totalProjects).toBe(100);
      expect(result.totalDataSources).toBe(100);
      expect(result.totalJobs).toBe(100);
      expect(result.totalSnapshots).toBe(100);
      expect(result.storageSize).toBe('15.0 MB');
      expect(result.dataSize).toBe('10.0 MB');
      expect(result.indexSize).toBe('5.0 MB');
    });

    it('should handle database stats errors', async () => {
      mockMongoose.connection.db.admin().command.mockRejectedValueOnce(
        new Error('Stats command failed')
      );

      await expect(mongoDatabase.getDatabaseStats()).rejects.toThrow('Stats command failed');
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      mockMongoose.connection.close = jest.fn().mockResolvedValue(undefined);

      await mongoDatabase.close();

      expect(mockMongoose.connection.close).toHaveBeenCalled();
    });

    it('should handle close errors', async () => {
      mockMongoose.connection.close = jest.fn().mockRejectedValue(new Error('Close failed'));

      await expect(mongoDatabase.close()).rejects.toThrow('Close failed');
    });
  });
});
