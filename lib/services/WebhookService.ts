import crypto from 'crypto';
import {
  WebhookConfig,
  WebhookPayload,
  WebhookAdapter,
  WebhookDelivery,
  WebhookDeliveryResult,
  WebhookServiceOptions,
  WebhookTemplateContext,
  ValidationResult
} from '../types/webhook';

export class WebhookService {
  private adapters = new Map<string, WebhookAdapter>();
  private options: Required<WebhookServiceOptions>;

  constructor(options: WebhookServiceOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelayMs: options.retryDelayMs ?? 1000,
      timeoutMs: options.timeoutMs ?? 10000,
      enableSignatures: options.enableSignatures ?? true,
      defaultHeaders: options.defaultHeaders ?? {
        'Content-Type': 'application/json',
        'User-Agent': 'Manifold-ETL/1.0'
      }
    };
  }

  /**
   * Register a webhook adapter
   */
  registerAdapter(adapter: WebhookAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }

  /**
   * Send webhook notification
   */
  async send(config: WebhookConfig, payload: WebhookPayload): Promise<WebhookDeliveryResult> {
    if (!config.isEnabled) {
      return {
        success: false,
        error: 'Webhook is disabled',
        retryable: false
      };
    }

    if (!config.events.includes(payload.event)) {
      return {
        success: true, // Not an error - just not configured for this event
        httpStatus: 204
      };
    }

    const adapter = this.adapters.get(config.type);
    if (!adapter) {
      return {
        success: false,
        error: `No adapter found for webhook type: ${config.type}`,
        retryable: false
      };
    }

    // Create delivery record
    const delivery = await this.createDelivery(config, payload);

    try {
      const result = await this.sendWithRetries(adapter, config, payload, delivery);
      await this.updateDelivery(delivery.id, {
        status: result.success ? 'success' : 'failed',
        httpStatus: result.httpStatus,
        responseBody: result.responseBody,
        errorMessage: result.error,
        deliveredAt: result.success ? new Date().toISOString() : undefined
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.updateDelivery(delivery.id, {
        status: 'failed',
        errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
        retryable: false
      };
    }
  }

  /**
   * Send to multiple webhooks for an event
   */
  async sendToAll(
    configs: WebhookConfig[], 
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult[]> {
    const promises = configs.map(config => this.send(config, payload));
    return Promise.all(promises);
  }

  /**
   * Validate webhook configuration
   */
  async validateConfig(config: Partial<WebhookConfig>): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!config.type) {
      errors.push('Webhook type is required');
    } else {
      const adapter = this.adapters.get(config.type);
      if (!adapter) {
        errors.push(`Unsupported webhook type: ${config.type}`);
      } else {
        const adapterValidation = await adapter.validateConfig(config);
        errors.push(...adapterValidation.errors);
      }
    }

    if (!config.url) {
      errors.push('Webhook URL is required');
    } else {
      try {
        new URL(config.url);
      } catch {
        errors.push('Invalid webhook URL format');
      }
    }

    if (!config.name?.trim()) {
      errors.push('Webhook name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Test webhook configuration
   */
  async testWebhook(config: WebhookConfig): Promise<WebhookDeliveryResult> {
    const testPayload: WebhookPayload = {
      event: 'start',
      timestamp: new Date().toISOString(),
      name: 'Test Webhook',
      description: 'This is a test message from Manifold ETL',
      projectId: config.projectId,
      pipelineId: config.pipelineId
    };

    return this.send(config, testPayload);
  }

  /**
   * Create template context for rendering
   */
  createTemplateContext(
    payload: WebhookPayload,
    additionalContext: Record<string, any> = {}
  ): WebhookTemplateContext {
    const timestamp = new Date(payload.timestamp);
    
    const context: WebhookTemplateContext = {
      event: payload.event,
      timestamp: payload.timestamp,
      formattedTimestamp: timestamp.toLocaleString(),
      projectName: additionalContext.projectName,
      pipelineName: additionalContext.pipelineName,
      jobName: additionalContext.jobName,
      dataSourceName: additionalContext.dataSourceName,
      ...additionalContext
    };

    // Add event-specific context
    if ('duration' in payload && payload.duration !== undefined) {
      context.durationMs = payload.duration;
      context.duration = this.formatDuration(payload.duration);
    }

    if ('error' in payload) {
      context.error = payload.error;
    }

    if ('progressPercent' in payload) {
      context.progress = {
        percent: payload.progressPercent,
        currentStep: payload.currentStep,
        message: payload.message
      };
    }

    if ('recordsProcessed' in payload) {
      context.recordsProcessed = payload.recordsProcessed;
    }

    if ('stats' in payload) {
      context.stats = payload.stats;
    }

    if ('status' in payload) {
      context.status = payload.status;
    }

    return context;
  }

  /**
   * Generate webhook signature for security
   */
  generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private async sendWithRetries(
    adapter: WebhookAdapter,
    config: WebhookConfig,
    payload: WebhookPayload,
    delivery: WebhookDelivery
  ): Promise<WebhookDeliveryResult> {
    let lastError: string | undefined;
    
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = await adapter.send(config, payload);
        
        if (result.success) {
          return result;
        }
        
        // Update attempt count
        await this.updateDelivery(delivery.id, {
          attemptCount: attempt,
          status: attempt === this.options.maxRetries ? 'failed' : 'retry'
        });
        
        lastError = result.error;
        
        // Don't retry if explicitly marked as non-retryable
        if (result.retryable === false) {
          return result;
        }
        
        // Don't retry on client errors (4xx)
        if (result.httpStatus && result.httpStatus >= 400 && result.httpStatus < 500) {
          return result;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.options.maxRetries) {
          await this.delay(this.options.retryDelayMs * Math.pow(2, attempt - 1));
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        
        await this.updateDelivery(delivery.id, {
          attemptCount: attempt,
          status: attempt === this.options.maxRetries ? 'failed' : 'retry',
          errorMessage: lastError
        });
        
        if (attempt < this.options.maxRetries) {
          await this.delay(this.options.retryDelayMs * Math.pow(2, attempt - 1));
        }
      }
    }
    
    return {
      success: false,
      error: lastError || 'Maximum retry attempts exceeded',
      retryable: false
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  // These would be implemented to interact with the database
  // For now, we'll create simple in-memory implementations
  private async createDelivery(
    config: WebhookConfig, 
    payload: WebhookPayload
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      webhookConfigId: config.id,
      eventType: payload.event,
      payload: JSON.stringify(payload),
      status: 'pending',
      attemptCount: 0,
      createdAt: new Date().toISOString()
    };
    
    // TODO: Save to database
    return delivery;
  }

  private async updateDelivery(
    id: string, 
    updates: Partial<WebhookDelivery>
  ): Promise<void> {
    // TODO: Update in database
    console.log(`Updating delivery ${id}:`, updates);
  }
}

// Default webhook service instance
export const webhookService = new WebhookService();
