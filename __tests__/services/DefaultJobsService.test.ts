import { DefaultJobsService } from '../../../lib/services/DefaultJobsService'

// Mock the database dependencies
jest.mock('../../../lib/server/database/SeparatedDatabaseManager', () => ({
  SeparatedDatabaseManager: {
    getInstance: jest.fn(() => ({
      getDataSource: jest.fn(),
      createDataSource: jest.fn(),
      getDataSources: jest.fn(),
      createDataVersion: jest.fn(),
      getDataSourceDb: jest.fn(),
    }))
  }
}))

jest.mock('../../../lib/server/database/CoreDatabase', () => ({
  CoreDatabase: {
    getInstance: jest.fn(() => ({
      getDbPath: jest.fn(() => '/test/path/core.db'),
      createJob: jest.fn(),
      getJobs: jest.fn(),
      getProjects: jest.fn(),
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

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/test/userData')
  }
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
      const mockCoreDb = {
        createJob: mockCreateJob
      }
      
      // Mock the CoreDatabase instance
      const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
      CoreDatabase.getInstance.mockReturnValue(mockCoreDb)

      await service.createDefaultJobs()

      expect(mockCreateJob).toHaveBeenCalledTimes(2)
      expect(mockCreateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Core Config Backup',
          type: 'backup',
          config: expect.objectContaining({
            backupType: 'core_config',
            schedule: '0 2 * * *'
          })
        })
      )
      expect(mockCreateJob).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Data Source Integrity Check',
          type: 'integrity_check',
          config: expect.objectContaining({
            checkType: 'metadata_integrity',
            schedule: '0 3 * * 0'
          })
        })
      )
    })

    it('handles errors during job creation', async () => {
      const mockCreateJob = jest.fn().mockRejectedValue(new Error('Database error'))
      const mockCoreDb = {
        createJob: mockCreateJob
      }
      
      const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
      CoreDatabase.getInstance.mockReturnValue(mockCoreDb)

      await expect(service.createDefaultJobs()).rejects.toThrow('Database error')
    })
  })

  describe('executeConfigBackup', () => {
    beforeEach(() => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)
      fs.copyFileSync.mockImplementation(() => {})
      fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() })
    })

    it('creates backup successfully', async () => {
      const result = await service.executeConfigBackup()

      expect(result.success).toBe(true)
      expect(result.message).toContain('backup completed successfully')
      expect(result.details).toMatchObject({
        backupSize: 1024,
        timestamp: expect.any(String)
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

    it('validates backup integrity', async () => {
      const fs = require('fs')
      fs.statSync
        .mockReturnValueOnce({ size: 1024, mtime: new Date() }) // Original
        .mockReturnValueOnce({ size: 2048, mtime: new Date() }) // Backup

      const result = await service.executeConfigBackup()

      expect(result.success).toBe(false)
      expect(result.error).toContain('Backup size mismatch')
    })

    it('cleans up old backups', async () => {
      const fs = require('fs')
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 35) // 35 days ago
      
      fs.readdirSync.mockReturnValue([
        'core-config-backup-2023-01-01.db',
        'other-file.txt'
      ])
      fs.statSync.mockReturnValue({ 
        size: 1024, 
        mtime: oldDate 
      })

      await service.executeConfigBackup()

      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('core-config-backup-2023-01-01.db')
      )
    })
  })

  describe('executeIntegrityCheck', () => {
    it('checks all projects and data sources', async () => {
      const mockProjects = [
        { id: 'project1', name: 'Project 1', dataSources: [] },
        { id: 'project2', name: 'Project 2', dataSources: [] }
      ]
      
      const mockDataSources = [
        {
          id: 'ds1',
          name: 'Data Source 1',
          type: 'csv',
          dataPath: '/test/path/ds1.db',
          lastSyncAt: new Date(),
          enabled: true
        }
      ]

      const mockCoreDb = {
        getProjects: jest.fn().mockResolvedValue(mockProjects)
      }
      
      const mockDbManager = {
        getDataSources: jest.fn().mockResolvedValue(mockDataSources),
        getDataSourceDb: jest.fn().mockResolvedValue({
          getStats: jest.fn().mockResolvedValue({ totalVersions: 1 })
        })
      }

      const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
      const { SeparatedDatabaseManager } = require('../../../lib/server/database/SeparatedDatabaseManager')
      
      CoreDatabase.getInstance.mockReturnValue(mockCoreDb)
      SeparatedDatabaseManager.getInstance.mockReturnValue(mockDbManager)

      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)

      const result = await service.executeIntegrityCheck()

      expect(result.success).toBe(true)
      expect(result.details.projectsChecked).toBe(2)
      expect(mockDbManager.getDataSources).toHaveBeenCalledTimes(2)
    })

    it('identifies missing database files', async () => {
      const mockProjects = [{ id: 'project1', name: 'Project 1', dataSources: [] }]
      const mockDataSources = [{
        id: 'ds1',
        name: 'Data Source 1',
        type: 'csv',
        dataPath: '/test/path/ds1.db',
        lastSyncAt: new Date(),
        enabled: true
      }]

      const mockCoreDb = {
        getProjects: jest.fn().mockResolvedValue(mockProjects)
      }
      
      const mockDbManager = {
        getDataSources: jest.fn().mockResolvedValue(mockDataSources)
      }

      const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
      const { SeparatedDatabaseManager } = require('../../../lib/server/database/SeparatedDatabaseManager')
      
      CoreDatabase.getInstance.mockReturnValue(mockCoreDb)
      SeparatedDatabaseManager.getInstance.mockReturnValue(mockDbManager)

      const fs = require('fs')
      fs.existsSync.mockReturnValue(false) // File doesn't exist

      const result = await service.executeIntegrityCheck()

      expect(result.success).toBe(false)
      expect(result.details.issuesFound).toBeGreaterThan(0)
      expect(result.details.issues).toContain(
        expect.stringContaining('Data source database file missing')
      )
    })

    it('identifies stale data sources', async () => {
      const mockProjects = [{ id: 'project1', name: 'Project 1', dataSources: [] }]
      const staleDate = new Date()
      staleDate.setDate(staleDate.getDate() - 10) // 10 days ago
      
      const mockDataSources = [{
        id: 'ds1',
        name: 'Data Source 1',
        type: 'csv',
        dataPath: '/test/path/ds1.db',
        lastSyncAt: staleDate,
        enabled: true
      }]

      const mockCoreDb = {
        getProjects: jest.fn().mockResolvedValue(mockProjects)
      }
      
      const mockDbManager = {
        getDataSources: jest.fn().mockResolvedValue(mockDataSources)
      }

      const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
      const { SeparatedDatabaseManager } = require('../../../lib/server/database/SeparatedDatabaseManager')
      
      CoreDatabase.getInstance.mockReturnValue(mockCoreDb)
      SeparatedDatabaseManager.getInstance.mockReturnValue(mockDbManager)

      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)

      const result = await service.executeIntegrityCheck()

      expect(result.success).toBe(false)
      expect(result.details.issues).toContain(
        expect.stringContaining("hasn't been synced for")
      )
    })
  })

  describe('getJobStatus', () => {
    it('returns job status for both default jobs', async () => {
      const mockJobs = [
        {
          id: 'job1',
          type: 'backup',
          config: JSON.stringify({ backupType: 'core_config' }),
          status: 'completed',
          lastRun: new Date().toISOString()
        },
        {
          id: 'job2',
          type: 'integrity_check',
          status: 'active',
          lastRun: new Date().toISOString()
        }
      ]

      const mockCoreDb = {
        getJobs: jest.fn().mockResolvedValue(mockJobs)
      }

      const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
      CoreDatabase.getInstance.mockReturnValue(mockCoreDb)

      const status = await service.getJobStatus()

      expect(status.configBackupJob).toMatchObject({
        id: 'job1',
        type: 'backup',
        status: 'completed'
      })
      expect(status.integrityCheckJob).toMatchObject({
        id: 'job2',
        type: 'integrity_check',
        status: 'active'
      })
    })

    it('returns null for missing jobs', async () => {
      const mockCoreDb = {
        getJobs: jest.fn().mockResolvedValue([])
      }

      const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
      CoreDatabase.getInstance.mockReturnValue(mockCoreDb)

      const status = await service.getJobStatus()

      expect(status.configBackupJob).toBeNull()
      expect(status.integrityCheckJob).toBeNull()
    })
  })

  describe('runJobManually', () => {
    it('runs backup job manually', async () => {
      const fs = require('fs')
      fs.existsSync.mockReturnValue(true)
      fs.copyFileSync.mockImplementation(() => {})
      fs.statSync.mockReturnValue({ size: 1024, mtime: new Date() })

      const result = await service.runJobManually('backup')

      expect(result.success).toBe(true)
      expect(result.message).toContain('backup completed')
    })

    it('runs integrity check job manually', async () => {
      const mockProjects = [{ id: 'project1', name: 'Project 1', dataSources: [] }]
      const mockCoreDb = {
        getProjects: jest.fn().mockResolvedValue(mockProjects)
      }
      
      const mockDbManager = {
        getDataSources: jest.fn().mockResolvedValue([])
      }

      const { CoreDatabase } = require('../../../lib/server/database/CoreDatabase')
      const { SeparatedDatabaseManager } = require('../../../lib/server/database/SeparatedDatabaseManager')
      
      CoreDatabase.getInstance.mockReturnValue(mockCoreDb)
      SeparatedDatabaseManager.getInstance.mockReturnValue(mockDbManager)

      const result = await service.runJobManually('integrity_check')

      expect(result.success).toBe(true)
      expect(result.message).toContain('no issues found')
    })

    it('throws error for unknown job type', async () => {
      await expect(service.runJobManually('unknown' as any)).rejects.toThrow(
        'Unknown job type: unknown'
      )
    })
  })
})
