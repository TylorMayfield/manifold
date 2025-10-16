/**
 * @jest-environment jsdom
 */

import { ApiProvider } from '../../lib/services/ApiProvider';

// Mock fetch globally
global.fetch = jest.fn();

// Mock clientLogger
jest.mock('../../lib/utils/ClientLogger', () => ({
  clientLogger: {
    info: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('ApiProvider', () => {
  let apiProvider: ApiProvider;

  beforeEach(() => {
    apiProvider = ApiProvider.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ApiProvider.getInstance();
      const instance2 = ApiProvider.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('fetchData', () => {
    const mockConfig = {
      url: 'https://api.example.com/data',
      method: 'GET' as const,
      headers: { 'Content-Type': 'application/json' },
      params: { page: '1' },
      authType: 'none' as const,
      authConfig: {}
    };

    it('should successfully fetch data from API', async () => {
      const mockResponse = {
        data: [{ id: 1, name: 'test' }],
        status: 200
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => mockResponse.data,
        text: async () => JSON.stringify(mockResponse.data)
      });

      const result = await apiProvider.fetchData(mockConfig);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(result.status).toBe(200);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/data?page=1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
        text: async () => 'Server Error'
      });

      const result = await apiProvider.fetchData(mockConfig);

      expect(result.success).toBe(false);
      expect(result.status).toBe(500);
      expect(result.error).toContain('Internal Server Error');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await apiProvider.fetchData(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle authentication with bearer token', async () => {
      const authConfig = {
        ...mockConfig,
        authType: 'bearer' as const,
        authConfig: { token: 'test-token' }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => [],
        text: async () => '[]'
      });

      await apiProvider.fetchData(authConfig);

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should handle POST requests with body', async () => {
      const postConfig = {
        ...mockConfig,
        method: 'POST' as const,
        body: JSON.stringify({ name: 'test' })
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ id: 1, name: 'test' }),
        text: async () => JSON.stringify({ id: 1, name: 'test' })
      });

      const result = await apiProvider.fetchData(postConfig);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' })
        })
      );
    });
  });

  describe('testConnection', () => {
    it('should successfully test API connection', async () => {
      const config = {
        url: 'https://api.example.com/health',
        method: 'GET' as const,
        headers: {},
        params: {},
        authType: 'none' as const,
        authConfig: {}
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map(),
        text: async () => 'OK'
      });

      const result = await apiProvider.testConnection(config);

      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should handle connection test failures', async () => {
      const config = {
        url: 'https://api.example.com/health',
        method: 'GET' as const,
        headers: {},
        params: {},
        authType: 'none' as const,
        authConfig: {}
      };

      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection refused'));

      const result = await apiProvider.testConnection(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection refused');
    });
  });
});
