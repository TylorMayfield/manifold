import {
  WebhookAdapter,
  WebhookConfig,
  WebhookPayload,
  WebhookDeliveryResult,
  ValidationResult,
  WebhookTemplateContext
} from '../types/webhook';
import { WebhookService } from '../services/WebhookService';

interface GenericWebhookMessage {
  event: string;
  timestamp: string;
  payload: WebhookPayload;
  context: WebhookTemplateContext;
  signature?: string;
}

export class GenericAdapter implements WebhookAdapter {
  readonly type = 'webhook';
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  async send(config: WebhookConfig, payload: WebhookPayload): Promise<WebhookDeliveryResult> {
    try {
      const message = this.formatMessage(config, payload);
      const body = JSON.stringify(message);

      // Generate signature if secret is provided
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers
      };

      if (config.secret) {
        const signature = this.webhookService.generateSignature(body, config.secret);
        headers['X-Manifold-Signature'] = `sha256=${signature}`;
        headers['X-Manifold-Signature-256'] = `sha256=${signature}`;
      }

      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body
      });

      const responseText = await response.text();

      return {
        success: response.ok,
        httpStatus: response.status,
        responseBody: responseText,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        retryable: response.status >= 500 || response.status === 429
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        retryable: true
      };
    }
  }

  async validateConfig(config: Partial<WebhookConfig>): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!config.url) {
      errors.push('Webhook URL is required');
    } else {
      try {
        const url = new URL(config.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          errors.push('Webhook URL must use HTTP or HTTPS protocol');
        }
      } catch {
        errors.push('Invalid webhook URL format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private formatMessage(config: WebhookConfig, payload: WebhookPayload): GenericWebhookMessage {
    const context = this.webhookService.createTemplateContext(payload);
    
    const message: GenericWebhookMessage = {
      event: payload.event,
      timestamp: payload.timestamp,
      payload: this.sanitizePayload(payload),
      context: this.sanitizeContext(context)
    };

    // Apply custom template transformations if specified
    if (config.templateConfig.customFields) {
      for (const [key, template] of Object.entries(config.templateConfig.customFields)) {
        message.context[key] = this.interpolateTemplate(template, context);
      }
    }

    return message;
  }

  private sanitizePayload(payload: WebhookPayload): WebhookPayload {
    // Create a clean copy of the payload without potentially sensitive data
    const sanitized = { ...payload };
    
    // Remove stack traces from error payloads to keep them clean
    if ('error' in sanitized && sanitized.error.stack) {
      sanitized.error = {
        ...sanitized.error,
        stack: undefined
      };
    }

    return sanitized;
  }

  private sanitizeContext(context: WebhookTemplateContext): WebhookTemplateContext {
    // Create a clean copy of the context, keeping all fields for now
    return { ...context };
  }

  private interpolateTemplate(template: string, context: WebhookTemplateContext): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match;
    });
  }
}