import { SeparatedDatabaseManager } from '../../../lib/server/database/SeparatedDatabaseManager'

// Mock the dependencies
jest.mock('../../../lib/server/database/CoreDatabase', () => ({
  CoreDatabase: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      close: jest.fn(),
      createProject: jest.fn(),
      getProjects: jest.fn(),
      getProject: jest.fn(),
      updateProject: jest.fn(),
      deleteProject: jest.fn(),
      createDataSource: jest.fn(),
      getDataSources: jest.fn(),
      getDataSource: jest.fn(),
      updateDataSource: jest.fn(),
      deleteDataSource: jest.fn(),
      createJob: jest.fn(),
      getJobs: jest.fn(),
      updateJob: jest.fn(),
      deleteJob: jest.fn(),
      createBackup: jest.fn(),
      getBackups: jest.fn(),
      updateBackup: jest.fn(),
      deleteBackup: jest.fn(),
      createRelationship: jest.fn(),
      getRelationships: jest.fn(),
      deleteRelationship: jest.fn(),
      createConsolidatedModel: jest.fn(),
      getConsolidatedModels: jest.fn(),
      updateConsolidatedModel: jest.fn(),
      deleteConsolidatedModel: jest.fn()
    }))
  }
}))

jest.mock('../../../lib/server/database/DataSourceDatabase', () => ({
  DataSourceDatabase: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      close: jest.fn(),
      createDataVersion: jest.fn(),
      getDataVersion: jest.fn(),
      getLatestDataVersion: jest.fn(),
      getAllDataVersions: jest.fn(),
      getDataFromVersion: jest.fn(),
      getDataSourceStats: jest.fn(),
      deleteDataVersion: jest.fn()
    }))
  }
}))

jest.mock('../../../lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn()
}))

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/test/userData')
  }
}))

describe('SeparatedDatabaseManager', () => {
  let manager: SeparatedDatabaseManager
  let mockCoreDb: any
  let mockDataSourceDb: any

  beforeEach(() => {
    jest.clearAllMocks()
    manager = SeparatedDatabaseManager.getInstance()
    
    const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
    const { DataSourceDatabase } = require('../../../lib/server/database/DataSourceDatabase')
    
    mockCoreDb = CoreDatabase.getInstance()
    mockDataSourceDb = DataSourceDatabase.getInstance()
  })

  describe('initialization', () => {
    it('initializes core database', async () => {
      await manager.initialize()

      expect(mockCoreDb.initialize).toHaveBeenCalledTimes(1)
    })

    it('closes core database', async () => {
      await manager.close()

      expect(mockCoreDb.close).toHaveBeenCalledTimes(1)
    })
  })

  describe('project operations', () => {
    it('creates a project', async () => {
      const projectData = { name: 'Test Project', description: 'Test Description' }
      const expectedProject = { id: 'project1', ...projectData }

      mockCoreDb.createProject.mockResolvedValue(expectedProject)

      const result = await manager.createProject(projectData)

      expect(mockCoreDb.createProject).toHaveBeenCalledWith(projectData)
      expect(result).toEqual(expectedProject)
    })

    it('gets all projects', async () => {
      const expectedProjects = [
        { id: 'project1', name: 'Project 1' },
        { id: 'project2', name: 'Project 2' }
      ]

      mockCoreDb.getProjects.mockResolvedValue(expectedProjects)

      const result = await manager.getProjects()

      expect(mockCoreDb.getProjects).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedProjects)
    })

    it('gets a specific project', async () => {
      const expectedProject = { id: 'project1', name: 'Project 1' }

      mockCoreDb.getProject.mockResolvedValue(expectedProject)

      const result = await manager.getProject('project1')

      expect(mockCoreDb.getProject).toHaveBeenCalledWith('project1')
      expect(result).toEqual(expectedProject)
    })

    it('updates a project', async () => {
      const updates = { name: 'Updated Project' }
      const expectedProject = { id: 'project1', name: 'Updated Project' }

      mockCoreDb.updateProject.mockResolvedValue(expectedProject)

      const result = await manager.updateProject('project1', updates)

      expect(mockCoreDb.updateProject).toHaveBeenCalledWith('project1', updates)
      expect(result).toEqual(expectedProject)
    })

    it('deletes a project and associated data source files', async () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)

      const dataSources = [
        {
          id: 'ds1',
          config: JSON.stringify({ dataPath: '/test/path/ds1.db' })
        }
      ]

      mockCoreDb.getDataSources.mockResolvedValue(dataSources)

      await manager.deleteProject('project1')

      expect(mockCoreDb.getDataSources).toHaveBeenCalledWith('project1')
      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/path/ds1.db')
      expect(mockCoreDb.deleteProject).toHaveBeenCalledWith('project1')
    })
  })

  describe('data source operations', () => {
    it('creates a data source with database file', async () => {
      const dataSourceData = {
        name: 'Test Data Source',
        type: 'csv',
        config: { delimiter: ',' },
        syncInterval: 60
      }

      const expectedDataSource = {
        id: 'ds_test',
        projectId: 'project1',
        ...dataSourceData,
        config: JSON.stringify({ ...dataSourceData.config, dataPath: '/test/userData/data_sources/ds_test.db' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        enabled: true
      }

      mockCoreDb.createDataSource.mockResolvedValue(expectedDataSource)
      mockDataSourceDb.initialize.mockResolvedValue(undefined)

      const result = await manager.createDataSource('project1', dataSourceData)

      expect(mockCoreDb.createDataSource).toHaveBeenCalledWith('project1', expect.objectContaining({
        id: expect.stringMatching(/^ds_\d+_[a-z0-9]+$/),
        name: dataSourceData.name,
        type: dataSourceData.type,
        config: expect.stringContaining('dataPath'),
        syncInterval: dataSourceData.syncInterval,
        enabled: true
      }))

      expect(mockDataSourceDb.initialize).toHaveBeenCalledTimes(1)
      expect(result).toMatchObject({
        name: dataSourceData.name,
        type: dataSourceData.type,
        config: expect.objectContaining({
          dataPath: expect.stringContaining('data_sources')
        })
      })
    })

    it('gets data sources for a project', async () => {
      const expectedDataSources = [
        {
          id: 'ds1',
          projectId: 'project1',
          name: 'Data Source 1',
          type: 'csv',
          config: JSON.stringify({ delimiter: ',' }),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          enabled: true
        }
      ]

      mockCoreDb.getDataSources.mockResolvedValue(expectedDataSources)

      const result = await manager.getDataSources('project1')

      expect(mockCoreDb.getDataSources).toHaveBeenCalledWith('project1')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        name: 'Data Source 1',
        type: 'csv',
        config: { delimiter: ',' }
      })
    })

    it('updates a data source', async () => {
      const updates = { name: 'Updated Data Source' }
      const expectedDataSource = {
        id: 'ds1',
        name: 'Updated Data Source',
        type: 'csv',
        config: JSON.stringify({ delimiter: ',' }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockCoreDb.updateDataSource.mockResolvedValue(expectedDataSource)

      const result = await manager.updateDataSource('ds1', updates)

      expect(mockCoreDb.updateDataSource).toHaveBeenCalledWith('ds1', updates)
      expect(result).toMatchObject({
        name: 'Updated Data Source',
        config: { delimiter: ',' }
      })
    })

    it('deletes a data source and its database file', async () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)

      const dataSource = {
        id: 'ds1',
        config: JSON.stringify({ dataPath: '/test/path/ds1.db' })
      }

      mockCoreDb.getDataSource.mockResolvedValue(dataSource)

      await manager.deleteDataSource('ds1')

      expect(mockCoreDb.getDataSource).toHaveBeenCalledWith('ds1')
      expect(fs.unlinkSync).toHaveBeenCalledWith('/test/path/ds1.db')
      expect(mockCoreDb.deleteDataSource).toHaveBeenCalledWith('ds1')
    })
  })

  describe('data version operations', () => {
    const mockDataSource = {
      id: 'ds1',
      projectId: 'project1',
      name: 'Test Data Source',
      config: { dataPath: '/test/path/ds1.db' }
    }

    beforeEach(() => {
      mockCoreDb.getDataSource.mockResolvedValue(mockDataSource)
    })

    it('creates a new data version', async () => {
      const data = [{ id: 1, name: 'Test' }]
      const schema = { id: 'number', name: 'string' }
      const metadata = { source: 'csv' }

      const expectedDataVersion = {
        id: 'version1',
        version: 1,
        createdAt: new Date(),
        recordCount: 1,
        schema,
        metadata
      }

      mockDataSourceDb.createDataVersion.mockResolvedValue(expectedDataVersion)

      const result = await manager.createDataVersion('ds1', data, schema, metadata)

      expect(mockCoreDb.getDataSource).toHaveBeenCalledWith('ds1')
      expect(mockDataSourceDb.initialize).toHaveBeenCalledTimes(1)
      expect(mockDataSourceDb.createDataVersion).toHaveBeenCalledWith(data, schema, metadata)
      expect(result).toEqual(expectedDataVersion)
    })

    it('gets a specific data version', async () => {
      const expectedDataVersion = {
        id: 'version1',
        version: 1,
        createdAt: new Date(),
        recordCount: 1,
        schema: {},
        metadata: {}
      }

      mockDataSourceDb.getDataVersion.mockResolvedValue(expectedDataVersion)

      const result = await manager.getDataVersion('ds1', 'version1')

      expect(mockDataSourceDb.getDataVersion).toHaveBeenCalledWith('version1')
      expect(result).toEqual(expectedDataVersion)
    })

    it('gets latest data version', async () => {
      const expectedDataVersion = {
        id: 'version2',
        version: 2,
        createdAt: new Date(),
        recordCount: 5,
        schema: {},
        metadata: {}
      }

      mockDataSourceDb.getLatestDataVersion.mockResolvedValue(expectedDataVersion)

      const result = await manager.getLatestDataVersion('ds1')

      expect(mockDataSourceDb.getLatestDataVersion).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedDataVersion)
    })

    it('gets all data versions', async () => {
      const expectedDataVersions = [
        { id: 'version2', version: 2, createdAt: new Date(), recordCount: 5, schema: {}, metadata: {} },
        { id: 'version1', version: 1, createdAt: new Date(), recordCount: 3, schema: {}, metadata: {} }
      ]

      mockDataSourceDb.getAllDataVersions.mockResolvedValue(expectedDataVersions)

      const result = await manager.getAllDataVersions('ds1')

      expect(mockDataSourceDb.getAllDataVersions).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedDataVersions)
    })

    it('gets data from a specific version', async () => {
      const expectedData = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }]

      mockDataSourceDb.getDataFromVersion.mockResolvedValue(expectedData)

      const result = await manager.getDataFromVersion('ds1', 'version1')

      expect(mockDataSourceDb.getDataFromVersion).toHaveBeenCalledWith('version1')
      expect(result).toEqual(expectedData)
    })

    it('gets data source statistics', async () => {
      const expectedStats = {
        totalVersions: 5,
        totalRecords: 100,
        latestVersion: {
          id: 'version5',
          version: 5,
          createdAt: new Date(),
          recordCount: 25,
          schema: {},
          metadata: {}
        }
      }

      mockDataSourceDb.getDataSourceStats.mockResolvedValue(expectedStats)

      const result = await manager.getDataSourceStats('ds1')

      expect(mockDataSourceDb.getDataSourceStats).toHaveBeenCalledTimes(1)
      expect(result).toEqual(expectedStats)
    })

    it('deletes a data version', async () => {
      mockDataSourceDb.deleteDataVersion.mockResolvedValue(undefined)

      await manager.deleteDataVersion('ds1', 'version1')

      expect(mockDataSourceDb.deleteDataVersion).toHaveBeenCalledWith('version1')
    })

    it('throws error when data source not found', async () => {
      mockCoreDb.getDataSource.mockResolvedValue(null)

      await expect(manager.createDataVersion('nonexistent', [], {}, {})).rejects.toThrow(
        'Data source with ID nonexistent not found.'
      )
    })
  })

  describe('delegated operations', () => {
    it('delegates job operations to core database', async () => {
      const jobData = { name: 'Test Job', type: 'backup' }
      const expectedJob = { id: 'job1', ...jobData }

      mockCoreDb.createJob.mockResolvedValue(expectedJob)
      mockCoreDb.getJobs.mockResolvedValue([expectedJob])

      await manager.createJob(jobData)
      const jobs = await manager.getJobs()

      expect(mockCoreDb.createJob).toHaveBeenCalledWith(jobData)
      expect(mockCoreDb.getJobs).toHaveBeenCalledTimes(1)
      expect(jobs).toEqual([expectedJob])
    })

    it('delegates backup operations to core database', async () => {
      const backupData = { name: 'Test Backup', type: 'full' }
      const expectedBackup = { id: 'backup1', ...backupData }

      mockCoreDb.createBackup.mockResolvedValue(expectedBackup)
      mockCoreDb.getBackups.mockResolvedValue([expectedBackup])

      await manager.createBackup('project1', backupData)
      const backups = await manager.getBackups('project1')

      expect(mockCoreDb.createBackup).toHaveBeenCalledWith('project1', backupData)
      expect(mockCoreDb.getBackups).toHaveBeenCalledWith('project1')
      expect(backups).toEqual([expectedBackup])
    })

    it('delegates relationship operations to core database', async () => {
      const relationshipData = { sourceId: 'ds1', targetId: 'ds2', type: 'one-to-many' }
      const expectedRelationship = { id: 'rel1', ...relationshipData }

      mockCoreDb.createRelationship.mockResolvedValue(expectedRelationship)
      mockCoreDb.getRelationships.mockResolvedValue([expectedRelationship])

      await manager.createRelationship('project1', relationshipData)
      const relationships = await manager.getRelationships('project1')

      expect(mockCoreDb.createRelationship).toHaveBeenCalledWith('project1', relationshipData)
      expect(mockCoreDb.getRelationships).toHaveBeenCalledWith('project1')
      expect(relationships).toEqual([expectedRelationship])
    })

    it('delegates consolidated model operations to core database', async () => {
      const modelData = { name: 'Test Model', description: 'Test Description' }
      const expectedModel = { id: 'model1', ...modelData }

      mockCoreDb.createConsolidatedModel.mockResolvedValue(expectedModel)
      mockCoreDb.getConsolidatedModels.mockResolvedValue([expectedModel])

      await manager.createConsolidatedModel('project1', modelData)
      const models = await manager.getConsolidatedModels('project1')

      expect(mockCoreDb.createConsolidatedModel).toHaveBeenCalledWith('project1', modelData)
      expect(mockCoreDb.getConsolidatedModels).toHaveBeenCalledWith('project1')
      expect(models).toEqual([expectedModel])
    })
  })
})
