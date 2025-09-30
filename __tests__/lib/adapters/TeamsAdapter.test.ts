import { TeamsAdapter } from '../../../lib/adapters/TeamsAdapter';
import { WebhookService } from '../../../lib/services/WebhookService';
import { WebhookConfig, WebhookPayload } from '../../../lib/types/webhook';

// Mock fetch
global.fetch = jest.fn();

describe('TeamsAdapter', () => {
  let adapter: TeamsAdapter;
  let webhookService: WebhookService;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
    
    webhookService = new WebhookService();
    adapter = new TeamsAdapter(webhookService);
  });

  describe('Adapter Properties', () => {
    it('should have correct type', () => {
      expect(adapter.type).toBe('teams');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate valid Teams webhook URL', async () => {
      const config: Partial<WebhookConfig> = {
        url: 'https://outlook.office.com/webhook/abc123'
      };

      const result = await adapter.validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate alternative Teams webhook URL', async () => {
      const config: Partial<WebhookConfig> = {
        url: 'https://outlook.office365.com/webhook/xyz789'
      };

      const result = await adapter.validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing URL', async () => {
      const config: Partial<WebhookConfig> = {};

      const result = await adapter.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Teams webhook URL is required');
    });

    it('should reject non-Teams URL', async () => {
      const config: Partial<WebhookConfig> = {
        url: 'https://example.com/webhook'
      };

      const result = await adapter.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('valid Microsoft Teams webhook URL');
    });

    it('should reject non-HTTPS URL', async () => {
      const config: Partial<WebhookConfig> = {
        url: 'http://outlook.office.com/webhook/test'
      };

      const result = await adapter.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('HTTPS protocol');
    });

    it('should reject invalid URL format', async () => {
      const config: Partial<WebhookConfig> = {
        url: 'not-a-valid-url'
      };

      const result = await adapter.validateConfig(config);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid');
    });
  });

  describe('Message Sending - MessageCard Format', () => {
    it('should send MessageCard format successfully', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test Webhook',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['data.import.complete'],
        templateConfig: {
          format: 'messagecard'
        }
      };

      const payload: WebhookPayload = {
        event: 'data.import.complete',
        timestamp: '2024-01-01T12:00:00Z',
        projectId: 'proj-123',
        dataSourceId: 'ds-456',
        status: 'success'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      const result = await adapter.send(config, payload);

      expect(result.success).toBe(true);
      expect(result.httpStatus).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        config.url,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );

      // Verify message structure
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1]?.body as string);
      
      expect(body['@type']).toBe('MessageCard');
      expect(body.title).toContain('Manifold');
      expect(body.sections).toBeDefined();
      expect(Array.isArray(body.sections)).toBe(true);
    });

    it('should include facts in MessageCard', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {}
      };

      const payload: WebhookPayload = {
        event: 'data.import.complete',
        timestamp: '2024-01-01T12:00:00Z',
        projectId: 'proj-123',
        dataSourceId: 'ds-456',
        recordCount: 1000,
        duration: 5000
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      await adapter.send(config, payload);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const facts = body.sections[0].facts;

      expect(facts).toBeDefined();
      expect(facts.length).toBeGreaterThan(0);
      
      // Check for specific facts
      const recordFact = facts.find((f: any) => f.name.includes('Records'));
      expect(recordFact).toBeDefined();
      expect(recordFact.value).toContain('1,000');
    });

    it('should use correct color for success events', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {}
      };

      const payload: WebhookPayload = {
        event: 'job.success',
        timestamp: '2024-01-01T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      await adapter.send(config, payload);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      
      expect(body.themeColor).toBe('28a745'); // Green
    });

    it('should use correct color for error events', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {}
      };

      const payload: WebhookPayload = {
        event: 'job.error',
        timestamp: '2024-01-01T12:00:00Z',
        error: {
          name: 'ImportError',
          message: 'Failed to import data'
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      await adapter.send(config, payload);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      
      expect(body.themeColor).toBe('dc3545'); // Red
      
      // Check for error section
      const errorSection = body.sections.find((s: any) => 
        s.activityTitle && s.activityTitle.includes('Error')
      );
      expect(errorSection).toBeDefined();
    });
  });

  describe('Message Sending - Adaptive Card Format', () => {
    it('should send Adaptive Card format when specified', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {
          format: 'adaptive'
        }
      };

      const payload: WebhookPayload = {
        event: 'data.sync.start',
        timestamp: '2024-01-01T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      await adapter.send(config, payload);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      
      expect(body.type).toBe('message');
      expect(body.attachments).toBeDefined();
      expect(body.attachments[0].contentType).toBe('application/vnd.microsoft.card.adaptive');
      expect(body.attachments[0].content.type).toBe('AdaptiveCard');
    });

    it('should send Adaptive Card with complete structure', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {
          format: 'adaptive'
        }
      };

      const payload: WebhookPayload = {
        event: 'project.updated',
        timestamp: '2024-01-01T12:00:00Z',
        projectId: 'proj-123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      const result = await adapter.send(config, payload);

      expect(result.success).toBe(true);
      
      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      
      // Verify Adaptive Card structure
      expect(body.attachments[0].content.body).toBeDefined();
      expect(Array.isArray(body.attachments[0].content.body)).toBe(true);
      expect(body.attachments[0].content.body.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors gracefully', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {}
      };

      const payload: WebhookPayload = {
        event: 'test.event',
        timestamp: '2024-01-01T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error'
      } as Response);

      const result = await adapter.send(config, payload);

      expect(result.success).toBe(false);
      expect(result.httpStatus).toBe(500);
      expect(result.error).toContain('500');
      expect(result.retryable).toBe(true);
    });

    it('should handle network errors', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {}
      };

      const payload: WebhookPayload = {
        event: 'test.event',
        timestamp: '2024-01-01T12:00:00Z'
      };

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await adapter.send(config, payload);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.retryable).toBe(true);
    });

    it('should mark 429 errors as retryable', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {}
      };

      const payload: WebhookPayload = {
        event: 'test.event',
        timestamp: '2024-01-01T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limited'
      } as Response);

      const result = await adapter.send(config, payload);

      expect(result.success).toBe(false);
      expect(result.retryable).toBe(true);
    });
  });

  describe('Template Customization', () => {
    it('should support custom title template', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {
          title: 'Custom: {{event}}'
        }
      };

      const payload: WebhookPayload = {
        event: 'custom.event',
        timestamp: '2024-01-01T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      await adapter.send(config, payload);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const activityTitle = body.sections[0].activityTitle;
      
      expect(activityTitle).toBe('Custom: custom.event');
    });
  });

  describe('Message Formatting', () => {
    it('should format timestamps correctly', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {}
      };

      const payload: WebhookPayload = {
        event: 'test.event',
        timestamp: '2024-01-01T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      await adapter.send(config, payload);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const timeFact = body.sections[0].facts.find((f: any) => f.name.includes('Time'));
      
      expect(timeFact).toBeDefined();
      expect(timeFact.value).toBeTruthy();
    });

    it('should format large numbers with commas', async () => {
      const config: WebhookConfig = {
        id: 'webhook-1',
        name: 'Test',
        url: 'https://outlook.office.com/webhook/test',
        enabled: true,
        events: ['*'],
        templateConfig: {}
      };

      const payload: WebhookPayload = {
        event: 'data.import',
        timestamp: '2024-01-01T12:00:00Z',
        recordCount: 1234567
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '1'
      } as Response);

      await adapter.send(config, payload);

      const body = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      const recordsFact = body.sections[0].facts.find((f: any) => f.name.includes('Records'));
      
      expect(recordsFact.value).toContain(',');
      expect(recordsFact.value).toBe('1,234,567');
    });
  });
});
