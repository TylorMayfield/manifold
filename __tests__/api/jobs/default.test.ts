import { NextRequest } from 'next/server'
import { GET, POST } from '../../../../app/api/jobs/default/route'

// Mock the DefaultJobsService
const mockGetJobStatus = jest.fn()
const mockCreateDefaultJobs = jest.fn()
const mockExecuteConfigBackup = jest.fn()
const mockExecuteIntegrityCheck = jest.fn()

jest.mock('../../../../lib/services/DefaultJobsService', () => ({
  DefaultJobsService: jest.fn().mockImplementation(() => ({
    getJobStatus: mockGetJobStatus,
    createDefaultJobs: mockCreateDefaultJobs,
    executeConfigBackup: mockExecuteConfigBackup,
    executeIntegrityCheck: mockExecuteIntegrityCheck,
    runJobManually: jest.fn((jobType) => {
      if (jobType === 'backup') return mockExecuteConfigBackup()
      if (jobType === 'integrity_check') return mockExecuteIntegrityCheck()
      throw new Error('Unknown job type')
    })
  }))
}))

describe('/api/jobs/default', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns job status when action=status', async () => {
      const mockStatus = {
        configBackupJob: {
          id: 'job1',
          type: 'backup',
          status: 'completed',
          lastRun: '2023-01-01T00:00:00Z'
        },
        integrityCheckJob: {
          id: 'job2',
          type: 'integrity_check',
          status: 'active',
          lastRun: '2023-01-01T00:00:00Z'
        }
      }

      mockGetJobStatus.mockResolvedValue(mockStatus)

      const request = new NextRequest('http://localhost:3000/api/jobs/default?action=status')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockStatus)
      expect(mockGetJobStatus).toHaveBeenCalledTimes(1)
    })

    it('creates default jobs when action=create', async () => {
      mockCreateDefaultJobs.mockResolvedValue(undefined)

      const request = new NextRequest('http://localhost:3000/api/jobs/default?action=create')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        message: 'Default jobs created successfully'
      })
      expect(mockCreateDefaultJobs).toHaveBeenCalledTimes(1)
    })

    it('returns error for invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/default?action=invalid')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: "Invalid action. Use 'status' or 'create'"
      })
    })

    it('handles service errors', async () => {
      mockGetJobStatus.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/jobs/default?action=status')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Database connection failed'
      })
    })
  })

  describe('POST', () => {
    it('runs backup job manually', async () => {
      const mockResult = {
        success: true,
        message: 'Core config backup completed successfully',
        details: {
          backupPath: '/test/backup.db',
          backupSize: 1024,
          duration: 500
        }
      }

      mockExecuteConfigBackup.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/jobs/default', {
        method: 'POST',
        body: JSON.stringify({
          action: 'run',
          jobType: 'backup'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResult)
      expect(mockExecuteConfigBackup).toHaveBeenCalledTimes(1)
    })

    it('runs integrity check job manually', async () => {
      const mockResult = {
        success: true,
        message: 'Integrity check completed successfully - no issues found',
        details: {
          projectsChecked: 2,
          totalDataSources: 5,
          issuesFound: 0,
          duration: 1200
        }
      }

      mockExecuteIntegrityCheck.mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/jobs/default', {
        method: 'POST',
        body: JSON.stringify({
          action: 'run',
          jobType: 'integrity_check'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockResult)
      expect(mockExecuteIntegrityCheck).toHaveBeenCalledTimes(1)
    })

    it('returns error for invalid job type', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/default', {
        method: 'POST',
        body: JSON.stringify({
          action: 'run',
          jobType: 'invalid_type'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: "Invalid jobType. Use 'backup' or 'integrity_check'"
      })
    })

    it('returns error for missing job type', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/default', {
        method: 'POST',
        body: JSON.stringify({
          action: 'run'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: "Invalid jobType. Use 'backup' or 'integrity_check'"
      })
    })

    it('returns error for invalid action', async () => {
      const request = new NextRequest('http://localhost:3000/api/jobs/default', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invalid_action',
          jobType: 'backup'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: "Invalid action. Use 'run'"
      })
    })

    it('handles service errors', async () => {
      mockExecuteConfigBackup.mockRejectedValue(new Error('Backup failed'))

      const request = new NextRequest('http://localhost:3000/api/jobs/default', {
        method: 'POST',
        body: JSON.stringify({
          action: 'run',
          jobType: 'backup'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Backup failed'
      })
    })

    it('handles unknown errors', async () => {
      mockExecuteConfigBackup.mockRejectedValue('Unknown error')

      const request = new NextRequest('http://localhost:3000/api/jobs/default', {
        method: 'POST',
        body: JSON.stringify({
          action: 'run',
          jobType: 'backup'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Unknown error'
      })
    })
  })
})
