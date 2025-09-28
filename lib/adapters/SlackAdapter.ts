import {
  WebhookAdapter,
  WebhookConfig,
  WebhookPayload,
  WebhookDeliveryResult,
  ValidationResult,
  WebhookTemplateContext
} from '../types/webhook';
import { WebhookService } from '../services/WebhookService';

// Slack-specific message format types
interface SlackMessage {
  text?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  channel?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
}

interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  elements?: any[];
  fields?: any[];
}

interface SlackAttachment {
  color?: string;
  pretext?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: SlackField[];
  footer?: string;
  footer_icon?: string;
  ts?: number;
  mrkdwn_in?: string[];
}

interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export class SlackAdapter implements WebhookAdapter {
  readonly type = 'slack';
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  async send(config: WebhookConfig, payload: WebhookPayload): Promise<WebhookDeliveryResult> {
    try {
      const message = this.formatMessage(config, payload);
      const response = await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        body: JSON.stringify(message)
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
      errors.push('Slack webhook URL is required');
    } else {
      // Validate Slack webhook URL format
      const slackWebhookPattern = /^https:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+$/;
      if (!slackWebhookPattern.test(config.url)) {
        errors.push('Invalid Slack webhook URL format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private formatMessage(config: WebhookConfig, payload: WebhookPayload): SlackMessage {
    const context = this.webhookService.createTemplateContext(payload);
    const color = this.getEventColor(payload.event);
    const emoji = this.getEventEmoji(payload.event);
    
    const message: SlackMessage = {
      username: config.templateConfig.username || 'Manifold ETL',
      icon_emoji: config.templateConfig.iconEmoji || emoji,
      icon_url: config.templateConfig.avatarUrl,
    };

    // Use blocks for richer formatting (preferred by Slack)
    message.blocks = this.createBlocks(config, payload, context, color);
    
    // Fallback text for notifications
    message.text = this.createFallbackText(payload, context);

    return message;
  }

  private createBlocks(
    config: WebhookConfig, 
    payload: WebhookPayload, 
    context: WebhookTemplateContext,
    color: string
  ): SlackBlock[] {
    const blocks: SlackBlock[] = [];

    // Header block
    blocks.push({
      type: 'header',
      text: {
        type: 'plain_text',
        text: this.createTitle(config, payload, context)
      }
    });

    // Main content block
    const contentText = this.createContentText(payload, context);
    if (contentText) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: contentText
        }
      });
    }

    // Fields block for structured data
    const fields = this.createFields(payload, context);
    if (fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.map(field => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`
        }))
      });
    }

    // Context block for metadata
    const contextElements = this.createContextElements(payload, context);
    if (contextElements.length > 0) {
      blocks.push({
        type: 'context',
        elements: contextElements
      });
    }

    return blocks;
  }

  private createTitle(
    config: WebhookConfig, 
    payload: WebhookPayload, 
    context: WebhookTemplateContext
  ): string {
    if (config.templateConfig.title) {
      return this.interpolateTemplate(config.templateConfig.title, context);
    }

    const emoji = this.getEventEmoji(payload.event);
    const eventName = this.getEventDisplayName(payload.event);
    
    return `${emoji} ${eventName}: ${payload.name}`;
  }

  private createContentText(payload: WebhookPayload, context: WebhookTemplateContext): string {
    switch (payload.event) {
      case 'start':
        return `Pipeline execution started${payload.description ? `\n_${payload.description}_` : ''}`;
      
      case 'progress':
        return `Progress: *${payload.progressPercent}%*${payload.currentStep ? `\nCurrent step: ${payload.currentStep}` : ''}${payload.message ? `\n_${payload.message}_` : ''}`;
      
      case 'success':
        return `✅ Pipeline completed successfully in ${context.duration}${context.recordsProcessed ? `\nRecords processed: *${context.recordsProcessed.toLocaleString()}*` : ''}`;
      
      case 'failure':
        return `❌ Pipeline failed${context.duration ? ` after ${context.duration}` : ''}\n\`\`\`${payload.error.message}\`\`\``;
      
      case 'complete':
        const statusEmoji = payload.status === 'success' ? '✅' : payload.status === 'partial' ? '⚠️' : '❌';
        return `${statusEmoji} Pipeline execution completed with status: *${payload.status}*\nDuration: ${context.duration}${payload.summary.recordsProcessed ? `\nRecords processed: *${payload.summary.recordsProcessed.toLocaleString()}*` : ''}`;
      
      default:
        return '';
    }
  }

  private createFields(payload: WebhookPayload, context: WebhookTemplateContext): SlackField[] {
    const fields: SlackField[] = [];

    // Common fields
    if (context.projectName) {
      fields.push({ title: 'Project', value: context.projectName, short: true });
    }
    
    if (context.pipelineName) {
      fields.push({ title: 'Pipeline', value: context.pipelineName, short: true });
    }

    // Event-specific fields
    switch (payload.event) {
      case 'start':
        if (payload.estimatedDuration) {
          fields.push({ 
            title: 'Estimated Duration', 
            value: this.formatDuration(payload.estimatedDuration), 
            short: true 
          });
        }
        break;

      case 'success':
      case 'complete':
        if (payload.event === 'complete' && payload.summary.errors) {
          fields.push({ title: 'Errors', value: payload.summary.errors.toString(), short: true });
        }
        if (payload.event === 'complete' && payload.summary.warnings) {
          fields.push({ title: 'Warnings', value: payload.summary.warnings.toString(), short: true });
        }
        break;

      case 'failure':
        if (payload.error.code) {
          fields.push({ title: 'Error Code', value: payload.error.code, short: true });
        }
        break;
    }

    return fields;
  }

  private createContextElements(payload: WebhookPayload, context: WebhookTemplateContext): any[] {
    return [
      {
        type: 'mrkdwn',
        text: `📅 ${context.formattedTimestamp}`
      },
      {
        type: 'mrkdwn', 
        text: `🔗 <${this.createDeepLink(payload)}|View Details>`
      }
    ];
  }

  private createFallbackText(payload: WebhookPayload, context: WebhookTemplateContext): string {
    const eventName = this.getEventDisplayName(payload.event);
    return `${eventName}: ${payload.name}${context.duration ? ` (${context.duration})` : ''}`;
  }

  private createDeepLink(payload: WebhookPayload): string {
    // Create a link back to the app for more details
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    
    if (payload.pipelineId) {
      return `${baseUrl}/project/${payload.projectId}/pipelines/${payload.pipelineId}`;
    } else if (payload.jobId) {
      return `${baseUrl}/jobs/${payload.jobId}`;
    } else if (payload.dataSourceId) {
      return `${baseUrl}/project/${payload.projectId}/data-sources/${payload.dataSourceId}`;
    }
    
    return `${baseUrl}/project/${payload.projectId || 'default'}`;
  }

  private getEventColor(event: string): string {
    switch (event) {
      case 'start': return '#36a3d9'; // Blue
      case 'progress': return '#ffa500'; // Orange  
      case 'success': return '#28a745'; // Green
      case 'failure': return '#dc3545'; // Red
      case 'complete': return '#6f42c1'; // Purple
      default: return '#6c757d'; // Gray
    }
  }

  private getEventEmoji(event: string): string {
    switch (event) {
      case 'start': return '🚀';
      case 'progress': return '⏳';
      case 'success': return '✅';
      case 'failure': return '❌';
      case 'complete': return '🏁';
      case 'cancelled': return '⏹️';
      default: return '📋';
    }
  }

  private getEventDisplayName(event: string): string {
    switch (event) {
      case 'start': return 'Started';
      case 'progress': return 'Progress';
      case 'success': return 'Success';
      case 'failure': return 'Failed';
      case 'complete': return 'Complete';
      case 'cancelled': return 'Cancelled';
      default: return 'Event';
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  private interpolateTemplate(template: string, context: WebhookTemplateContext): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return context[key] || match;
    });
  }
}