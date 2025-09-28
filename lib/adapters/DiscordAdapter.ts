import {
  WebhookAdapter,
  WebhookConfig,
  WebhookPayload,
  WebhookDeliveryResult,
  ValidationResult,
  WebhookTemplateContext
} from '../types/webhook';
import { WebhookService } from '../services/WebhookService';

// Discord-specific message format types
interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  tts?: boolean;
  embeds?: DiscordEmbed[];
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: DiscordField[];
}

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

export class DiscordAdapter implements WebhookAdapter {
  readonly type = 'discord';
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
      errors.push('Discord webhook URL is required');
    } else {
      // Validate Discord webhook URL format
      const discordWebhookPattern = /^https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;
      if (!discordWebhookPattern.test(config.url)) {
        errors.push('Invalid Discord webhook URL format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private formatMessage(config: WebhookConfig, payload: WebhookPayload): DiscordMessage {
    const context = this.webhookService.createTemplateContext(payload);
    const embed = this.createEmbed(config, payload, context);
    
    const message: DiscordMessage = {
      username: config.templateConfig.username || 'Manifold ETL',
      avatar_url: config.templateConfig.avatarUrl,
      embeds: [embed]
    };

    // Add a brief content message for better notifications
    message.content = this.createContentMessage(payload, context);

    return message;
  }

  private createEmbed(
    config: WebhookConfig, 
    payload: WebhookPayload, 
    context: WebhookTemplateContext
  ): DiscordEmbed {
    const embed: DiscordEmbed = {
      title: this.createTitle(config, payload, context),
      description: this.createDescription(payload, context),
      color: this.getEventColor(payload.event),
      timestamp: payload.timestamp,
      footer: {
        text: 'Manifold ETL',
        icon_url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Gear/3D/gear_3d.png'
      }
    };

    // Add fields for structured data
    const fields = this.createFields(payload, context);
    if (fields.length > 0) {
      embed.fields = fields;
    }

    // Add author info if available
    if (context.projectName) {
      embed.author = {
        name: context.projectName,
        icon_url: 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/File%20folder/3D/file_folder_3d.png'
      };
    }

    // Add URL link back to the app
    embed.url = this.createDeepLink(payload);

    return embed;
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

  private createDescription(payload: WebhookPayload, context: WebhookTemplateContext): string {
    switch (payload.event) {
      case 'start':
        return `Pipeline execution started${payload.description ? `\n*${payload.description}*` : ''}`;
      
      case 'progress':
        return `**Progress: ${payload.progressPercent}%**${payload.currentStep ? `\nCurrent step: ${payload.currentStep}` : ''}${payload.message ? `\n*${payload.message}*` : ''}`;
      
      case 'success':
        return `✅ Pipeline completed successfully in **${context.duration}**${context.recordsProcessed ? `\nRecords processed: **${context.recordsProcessed.toLocaleString()}**` : ''}`;
      
      case 'failure':
        return `❌ Pipeline failed${context.duration ? ` after **${context.duration}**` : ''}\n\`\`\`\n${payload.error.message}\n\`\`\``;
      
      case 'complete':
        const statusEmoji = payload.status === 'success' ? '✅' : payload.status === 'partial' ? '⚠️' : '❌';
        return `${statusEmoji} Pipeline execution completed with status: **${payload.status}**\nDuration: **${context.duration}**${payload.summary.recordsProcessed ? `\nRecords processed: **${payload.summary.recordsProcessed.toLocaleString()}**` : ''}`;
      
      default:
        return `Event: ${(payload as WebhookPayload).event}`;
    }
  }

  private createContentMessage(payload: WebhookPayload, context: WebhookTemplateContext): string {
    const emoji = this.getEventEmoji(payload.event);
    const eventName = this.getEventDisplayName(payload.event);
    return `${emoji} **${eventName}**: ${payload.name}`;
  }

  private createFields(payload: WebhookPayload, context: WebhookTemplateContext): DiscordField[] {
    const fields: DiscordField[] = [];

    // Common fields
    if (context.pipelineName && context.pipelineName !== payload.name) {
      fields.push({ name: '📊 Pipeline', value: context.pipelineName, inline: true });
    }
    
    if (context.dataSourceName) {
      fields.push({ name: '🗃️ Data Source', value: context.dataSourceName, inline: true });
    }

    // Event-specific fields
    switch (payload.event) {
      case 'start':
        if (payload.estimatedDuration) {
          fields.push({ 
            name: '⏱️ Estimated Duration', 
            value: this.formatDuration(payload.estimatedDuration), 
            inline: true 
          });
        }
        break;

      case 'success':
        if (context.recordsProcessed) {
          fields.push({ 
            name: '📈 Records Processed', 
            value: context.recordsProcessed.toLocaleString(), 
            inline: true 
          });
        }
        break;

      case 'complete':
        if (payload.summary.errors) {
          fields.push({ name: '❌ Errors', value: payload.summary.errors.toString(), inline: true });
        }
        if (payload.summary.warnings) {
          fields.push({ name: '⚠️ Warnings', value: payload.summary.warnings.toString(), inline: true });
        }
        if (payload.summary.recordsProcessed) {
          fields.push({ 
            name: '📈 Records Processed', 
            value: payload.summary.recordsProcessed.toLocaleString(), 
            inline: true 
          });
        }
        break;

      case 'failure':
        if (payload.error.code) {
          fields.push({ name: '🔍 Error Code', value: `\`${payload.error.code}\``, inline: true });
        }
        if (context.duration) {
          fields.push({ name: '⏱️ Failed After', value: context.duration, inline: true });
        }
        break;

      case 'progress':
        fields.push({ 
          name: '📊 Progress', 
          value: `${payload.progressPercent}%`, 
          inline: true 
        });
        if (payload.currentStep) {
          fields.push({ 
            name: '👟 Current Step', 
            value: payload.currentStep, 
            inline: true 
          });
        }
        break;
    }

    // Add execution time for completed events
    if (context.duration && ['success', 'failure', 'complete'].includes(payload.event)) {
      fields.push({ name: '⏱️ Duration', value: context.duration, inline: true });
    }

    return fields;
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

  private getEventColor(event: string): number {
    switch (event) {
      case 'start': return 0x3498db; // Blue
      case 'progress': return 0xff9500; // Orange  
      case 'success': return 0x2ecc71; // Green
      case 'failure': return 0xe74c3c; // Red
      case 'complete': return 0x9b59b6; // Purple
      case 'cancelled': return 0x95a5a6; // Gray
      default: return 0x607d8b; // Blue Gray
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