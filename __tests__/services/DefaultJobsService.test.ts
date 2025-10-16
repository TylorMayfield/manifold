// Mock all dependencies before importing
jest.mock('../../lib/server/database/MongoDatabase', () => ({
  MongoDatabase: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      isHealthy: jest.fn(() => true),
      createJob: jest.fn(),
      updateJob: jest.fn(),
      getJobs: jest.fn(() => []),
      getProjects: jest.fn(() => []),
      getDataSources: jest.fn(() => []),
      getSnapshots: jest.fn(() => []),
      getPipelines: jest.fn(() => []),
    }))
  }
}), { virtual: true });

jest.mock('../../lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}), { virtual: true });

import { DefaultJobsService } from '../../lib/services/DefaultJobsService';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  copyFileSync: jest.fn(),
  statSync: jest.fn(() => ({ size: 1024, mtime: new Date() })),
  readdirSync: jest.fn(() => []),
  unlinkSync: jest.fn(),
  mkdirSync: jest.fn()
}))

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/'))
}))

jest.mock('process', () => ({
  cwd: jest.fn(() => '/test/project')
}))

describe('DefaultJobsService', () => {
  let service: DefaultJobsService

  beforeEach(() => {
    service = new DefaultJobsService()
    jest.clearAllMocks()
  })

  describe('createDefaultJobs', () => {
    it('creates both backup and integrity check jobs', async () => {
      const mockCreateJob = jest.fn()
      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        createJob: mockCreateJob,
        getJobs: jest.fn(() => []),
        getProjects: jest.fn(() => []),
        getDataSources: jest.fn(() => []),
        getSnapshots: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        updateJob: jest.fn(),
      }
      
      // Get the already mocked MongoDatabase instance
      const { MongoDatabase } = require('../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      await service.createDefaultJobs()

      expect(mockCreateJob).toHaveBeenCalledTimes(2)
      expect(mockCreateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'default',
          name: 'Core Config Backup',
          type: 'backup',
          schedule: '0 2 * * *',
          config: expect.objectContaining({
            backupType: 'core_config',
            retentionDays: 30
          })
        })
      )
      expect(mockCreateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'default',
          name: 'Data Source Integrity Check',
          type: 'integrity_check',
          schedule: '0 3 * * 0',
          config: expect.objectContaining({
            checkType: 'metadata_integrity',
            checkAllProjects: true
          })
        })
      )
    })

    it('handles errors during job creation', async () => {
      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        createJob: jest.fn().mockRejectedValue(new Error('Database error')),
        getJobs: jest.fn(() => []),
        getProjects: jest.fn(() => []),
        getDataSources: jest.fn(() => []),
        getSnapshots: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        updateJob: jest.fn(),
      }
      
      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      await expect(service.createDefaultJobs()).rejects.toThrow('Database error')
    })
  })

  describe('executeConfigBackup', () => {
    beforeEach(() => {
      const fs = require('fs')
      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      
      fs.existsSync.mockReturnValue(true)
      fs.writeFileSync = jest.fn()
      fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() })
      
      MongoDatabase.getInstance.mockReturnValue({
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getProjects: jest.fn(() => []),
        getDataSources: jest.fn(() => []),
        getJobs: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
        getSnapshots: jest.fn(() => []),
      })
    })

    it('creates MongoDB backup successfully', async () => {
      const result = await service.executeConfigBackup()

      expect(result.success).toBe(true)
      expect(result.message).toContain('MongoDB backup completed successfully')
      expect(result.details).toMatchObject({
        backupSize: 1024,
        timestamp: expect.any(String),
        projectsCount: expect.any(Number),
        dataSourcesCount: expect.any(Number)
      })
    })

    it('handles backup directory creation', async () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(false)

      await service.executeConfigBackup()

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('backups/core'),
        { recursive: true }
      )
    })

    it('exports MongoDB data to JSON', async () => {
      const fs = require('fs')
      fs.writeFileSync = jest.fn()

      await service.executeConfigBackup()

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('mongodb-backup-'),
        expect.any(String)
      )
    })

    it('cleans up old backups', async () => {
      const fs = require('fs')
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 35) // 35 days ago
      
      fs.readdirSync.mockReturnValue([
        'mongodb-backup-2023-01-01.json',
        'other-file.txt'
      ])
      fs.statSync.mockReturnValue({ 
        size: 1024, 
        mtime: oldDate 
      })

      await service.executeConfigBackup()

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('mongodb-backup-2023-01-01.json')
      )
    })
  })

  describe('executeIntegrityCheck', () => {
    it('checks all projects and data sources', async () => {
      const mockProjects = [
        { _id: 'project1', name: 'Project 1' },
        { _id: 'project2', name: 'Project 2' }
      ]
      
      const mockDataSources = [
        {
          id: 'ds1',
          name: 'Data Source 1',
          type: 'csv',
          lastSyncAt: new Date(),
          enabled: true
        }
      ]

      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getProjects: jest.fn().mockResolvedValue(mockProjects),
        getDataSources: jest.fn().mockResolvedValue(mockDataSources),
        getSnapshots: jest.fn().mockResolvedValue([{ id: 'snap1', version: 1 }]),
        getJobs: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }

      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      const result = await service.executeIntegrityCheck()

      expect(result.success).toBe(true)
      expect(result.details.projectsChecked).toBe(2)
      expect(mockMongoDb.getDataSources).toHaveBeenCalledTimes(2)
    })

    it('identifies missing snapshots', async () => {
      const mockProjects = [{ _id: 'project1', name: 'Project 1' }]
      const mockDataSources = [{
        id: 'ds1',
        name: 'Data Source 1',
        type: 'csv',
        lastSyncAt: new Date(),
        enabled: true
      }]

      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getProjects: jest.fn().mockResolvedValue(mockProjects),
        getDataSources: jest.fn().mockResolvedValue(mockDataSources),
        getSnapshots: jest.fn().mockResolvedValue([]), // No snapshots despite lastSyncAt
        getJobs: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }

      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      const result = await service.executeIntegrityCheck()

      expect(result.success).toBe(false)
      expect(result.details.issuesFound).toBeGreaterThan(0)
      expect(result.details.issues.some((issue: string) => 
        issue.includes('has no snapshots despite last sync')
      )).toBe(true)
    })

    it('identifies stale data sources', async () => {
      const mockProjects = [{ _id: 'project1', name: 'Project 1' }]
      const staleDate = new Date()
      staleDate.setDate(staleDate.getDate() - 10) // 10 days ago
      
      const mockDataSources = [{
        id: 'ds1',
        name: 'Data Source 1',
        type: 'csv',
        lastSyncAt: staleDate,
        enabled: true
      }]

      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getProjects: jest.fn().mockResolvedValue(mockProjects),
        getDataSources: jest.fn().mockResolvedValue(mockDataSources),
        getSnapshots: jest.fn().mockResolvedValue([]),
        getJobs: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }

      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      const result = await service.executeIntegrityCheck()

      expect(result.success).toBe(false)
      expect(result.details.issues.some((issue: string) =>
        issue.includes("hasn't been synced for")
      )).toBe(true)
    })
  })

  describe('getJobStatus', () => {
    it('returns job status for both default jobs', async () => {
      const mockJobs = [
        {
          _id: 'job1',
          type: 'backup',
          status: 'completed',
          lastRun: new Date()
        },
        {
          _id: 'job2',
          type: 'integrity_check',
          status: 'idle',
          lastRun: new Date()
        }
      ]

      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getJobs: jest.fn().mockResolvedValue(mockJobs),
        getProjects: jest.fn(() => []),
        getDataSources: jest.fn(() => []),
        getSnapshots: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }

      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      const status = await service.getJobStatus()

      expect(status.configBackupJob).toMatchObject({
        _id: 'job1',
        type: 'backup',
        status: 'completed'
      })
      expect(status.integrityCheckJob).toMatchObject({
        _id: 'job2',
        type: 'integrity_check',
        status: 'idle'
      })
    })

    it('returns null for missing jobs', async () => {
      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getJobs: jest.fn().mockResolvedValue([]),
        getProjects: jest.fn(() => []),
        getDataSources: jest.fn(() => []),
        getSnapshots: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }

      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      const status = await service.getJobStatus()

      expect(status.configBackupJob).toBeNull()
      expect(status.integrityCheckJob).toBeNull()
    })
  })

  describe('runJobManually', () => {
    it('runs backup job manually and updates job record', async () => {
      const fs = require('fs')
      const mockJobs = [{ _id: 'job1', type: 'backup', status: 'idle' }]
      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getJobs: jest.fn().mockResolvedValue(mockJobs),
        updateJob: jest.fn(),
        getProjects: jest.fn(() => []),
        getDataSources: jest.fn(() => []),
        getSnapshots: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
      }
      
      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)
      
      fs.existsSync.mockReturnValue(true)
      fs.writeFileSync = jest.fn()
      fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() })

      const result = await service.runJobManually('backup')

      expect(result.success).toBe(true)
      expect(result.message).toContain('MongoDB backup completed')
      expect(mockMongoDb.updateJob).toHaveBeenCalledWith(
        'job1',
        expect.objectContaining({
          status: 'completed',
          lastRun: expect.any(Date)
        })
      )
    })

    it('runs integrity check job manually', async () => {
      const mockProjects = [{ _id: 'project1', name: 'Project 1' }]
      const mockJobs = [{ _id: 'job2', type: 'integrity_check', status: 'idle' }]
      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getProjects: jest.fn().mockResolvedValue(mockProjects),
        getDataSources: jest.fn().mockResolvedValue([]),
        getSnapshots: jest.fn().mockResolvedValue([]),
        getJobs: jest.fn().mockResolvedValue(mockJobs),
        updateJob: jest.fn(),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
      }

      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      const result = await service.runJobManually('integrity_check')

      expect(result.success).toBe(true)
      expect(result.message).toContain('no issues found')
      expect(mockMongoDb.updateJob).toHaveBeenCalled()
    })

    it('creates job if it does not exist', async () => {
      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getJobs: jest.fn()
          .mockResolvedValueOnce([]) // No jobs initially
          .mockResolvedValueOnce([{ _id: 'new-job', type: 'backup' }]) // Job created
          .mockResolvedValueOnce([{ _id: 'new-job', type: 'backup' }]), // For final update
        createJob: jest.fn(),
        updateJob: jest.fn(),
        getProjects: jest.fn(() => []),
        getDataSources: jest.fn(() => []),
        getSnapshots: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
      }

      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)
      fs.writeFileSync = jest.fn()
      fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() })

      await service.runJobManually('backup')

      expect(mockMongoDb.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'default',
          type: 'backup'
        })
      )
    })

    it('throws error for unknown job type', async () => {
      const mockMongoDb = {
        initialize: jest.fn(),
        isHealthy: jest.fn(() => true),
        getJobs: jest.fn(() => []),
        getProjects: jest.fn(() => []),
        getDataSources: jest.fn(() => []),
        getSnapshots: jest.fn(() => []),
        getPipelines: jest.fn(() => []),
        createJob: jest.fn(),
        updateJob: jest.fn(),
      }
      
      const { MongoDatabase } = require('../../../lib/server/database/MongoDatabase')
      MongoDatabase.getInstance.mockReturnValue(mockMongoDb)

      await expect(service.runJobManually('unknown' as any)).rejects.toThrow(
        'Unknown job type: unknown'
      )
    })
  })
})
