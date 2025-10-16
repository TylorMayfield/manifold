/**
 * @jest-environment jsdom
 */

import { ApiProvider } from '../../lib/services/ApiProvider';

// Mock fetch globally
global.fetch = jest.fn();

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

    it('should handle authentication with API key', async () => {
      const authConfig = {
        ...mockConfig,
        authType: 'api_key' as const,
        authConfig: { 
          apiKey: 'test-key',
          apiKeyHeader: 'X-API-Key'
        }
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
            'X-API-Key': 'test-key'
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

    it('should handle different response types', async () => {
      const config = {
        ...mockConfig,
        headers: { 'Accept': 'text/csv' }
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'text/csv']]),
        text: async () => 'name,age\nJohn,25\nJane,30'
      });

      const result = await apiProvider.fetchData(config);

      expect(result.success).toBe(true);
      expect(result.data).toBe('name,age\nJohn,25\nJane,30');
    });

    it('should handle timeout errors', async () => {
      // Mock AbortController for timeout simulation
      const mockAbortController = {
        abort: jest.fn(),
        signal: { aborted: false }
      };
      
      global.AbortController = jest.fn(() => mockAbortController) as any;

      (fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        })
      );

      const result = await apiProvider.fetchData(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Request timeout');
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
      expect(result.latency).toBeGreaterThan(0);
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

  describe('validateConfig', () => {
    it('should validate correct API configuration', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: {},
        params: {},
        authType: 'none' as const,
        authConfig: {}
      };

      const result = apiProvider.validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid URL', () => {
      const config = {
        url: 'invalid-url',
        method: 'GET' as const,
        headers: {},
        params: {},
        authType: 'none' as const,
        authConfig: {}
      };

      const result = apiProvider.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });

    it('should detect missing authentication credentials', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: {},
        params: {},
        authType: 'bearer' as const,
        authConfig: {} // Missing token
      };

      const result = apiProvider.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Bearer token is required');
    });

    it('should detect missing API key header', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: {},
        params: {},
        authType: 'api_key' as const,
        authConfig: {
          apiKey: 'test-key'
          // Missing apiKeyHeader
        }
      };

      const result = apiProvider.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('API key header is required');
    });
  });

  describe('buildUrl', () => {
    it('should build URL with query parameters', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: {},
        params: { page: '1', limit: '10' },
        authType: 'none' as const,
        authConfig: {}
      };

      const result = apiProvider.buildUrl(config);

      expect(result).toBe('https://api.example.com/data?page=1&limit=10');
    });

    it('should handle URL without parameters', () => {
      const config = {
        url: 'https://api.example.com/data',
        method: 'GET' as const,
        headers: {},
        params: {},
        authType: 'none' as const,
        authConfig: {}
      };

      const result = apiProvider.buildUrl(config);

      expect(result).toBe('https://api.example.com/data');
    });

    it('should handle URL with existing query parameters', () => {
      const config = {
        url: 'https://api.example.com/data?existing=param',
        method: 'GET' as const,
        headers: {},
        params: { page: '1' },
        authType: 'none' as const,
        authConfig: {}
      };

      const result = apiProvider.buildUrl(config);

      expect(result).toBe('https://api.example.com/data?existing=param&page=1');
    });
  });
});
