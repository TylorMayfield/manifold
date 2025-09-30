import {
  WebhookAdapter,
  WebhookConfig,
  WebhookPayload,
  WebhookDeliveryResult,
  ValidationResult,
  WebhookTemplateContext
} from '../types/webhook';
import { WebhookService } from '../services/WebhookService';

interface TeamsMessageCard {
  '@type': 'MessageCard';
  '@context': 'https://schema.org/extensions';
  summary: string;
  themeColor: string;
  title: string;
  sections: TeamsSection[];
  potentialAction?: TeamsAction[];
}

interface TeamsSection {
  activityTitle?: string;
  activitySubtitle?: string;
  activityImage?: string;
  facts?: TeamsFact[];
  text?: string;
  markdown?: boolean;
}

interface TeamsFact {
  name: string;
  value: string;
}

interface TeamsAction {
  '@type': string;
  name: string;
  target?: string[];
  targets?: Array<{ os: string; uri: string }>;
}

interface TeamsAdaptiveCard {
  type: 'message';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: {
      type: 'AdaptiveCard';
      $schema: string;
      version: string;
      body: any[];
      actions?: any[];
    };
  }>;
}

/**
 * Microsoft Teams Webhook Adapter
 * 
 * Formats messages for Microsoft Teams using MessageCard format (legacy)
 * and Adaptive Cards format (modern).
 * 
 * Features:
 * - Rich formatting with colors and icons
 * - Support for facts/details
 * - Action buttons
 * - Both MessageCard and Adaptive Card formats
 * - Event-based color coding
 */
export class TeamsAdapter implements WebhookAdapter {
  readonly type = 'teams';
  private webhookService: WebhookService;

  constructor(webhookService: WebhookService) {
    this.webhookService = webhookService;
  }

  async send(config: WebhookConfig, payload: WebhookPayload): Promise<WebhookDeliveryResult> {
    try {
      const useAdaptiveCards = (config.templateConfig as any)?.format === 'adaptive';
      const message = useAdaptiveCards 
        ? this.formatAdaptiveCard(config, payload)
        : this.formatMessageCard(config, payload);
      
      const body = JSON.stringify(message);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers
      };

      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body
      });

      const responseText = await response.text();

      // Teams returns "1" on success
      const isSuccess = response.ok && (responseText === '1' || response.status === 200);

      return {
        success: isSuccess,
        httpStatus: response.status,
        responseBody: responseText,
        error: isSuccess ? undefined : `HTTP ${response.status}: ${response.statusText}`,
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
      errors.push('Teams webhook URL is required');
    } else {
      try {
        const url = new URL(config.url);
        
        // Validate it's a Teams webhook URL
        if (!url.hostname.includes('office.com') && 
            !url.hostname.includes('office365.com') &&
            !url.hostname.includes('webhook.office.com')) {
          errors.push('URL must be a valid Microsoft Teams webhook URL');
        }

        if (!['https:'].includes(url.protocol)) {
          errors.push('Teams webhook URL must use HTTPS protocol');
        }
      } catch {
        errors.push('Invalid Teams webhook URL format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format message as Teams MessageCard (legacy format)
   * More widely supported and simpler
   */
  private formatMessageCard(config: WebhookConfig, payload: WebhookPayload): TeamsMessageCard {
    const context = this.webhookService.createTemplateContext(payload);
    const color = this.getColorForEvent(payload.event);
    const icon = this.getIconForEvent(payload.event);

    const sections: TeamsSection[] = [];

    // Main section with event details
    const mainSection: TeamsSection = {
      activityTitle: this.formatTitle(config, context),
      activitySubtitle: `Event: ${payload.event}`,
      activityImage: icon,
      facts: this.extractFacts(payload, context),
      markdown: true
    };

    sections.push(mainSection);

    // Add message/description section if present
    if (context.message) {
      sections.push({
        text: context.message,
        markdown: true
      });
    }

    // Add error details if it's an error event
    if ('error' in payload && payload.error) {
      sections.push({
        activityTitle: '❌ Error Details',
        facts: [
          { name: 'Error Message', value: payload.error.message || 'Unknown error' },
          { name: 'Error Type', value: (payload.error as any).name || 'Error' }
        ],
        markdown: true
      });
    }

    const card: TeamsMessageCard = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: `${payload.event} - ${context.title || 'Manifold Notification'}`,
      themeColor: color,
      title: `📊 Manifold - ${context.title || payload.event}`,
      sections
    };

    // Add action buttons if URL is provided
    if (context.url) {
      card.potentialAction = [
        {
          '@type': 'OpenUri',
          name: 'View Details',
          targets: [{ os: 'default', uri: context.url }]
        }
      ];
    }

    return card;
  }

  /**
   * Format message as Teams Adaptive Card (modern format)
   * More flexible and feature-rich
   */
  private formatAdaptiveCard(config: WebhookConfig, payload: WebhookPayload): TeamsAdaptiveCard {
    const context = this.webhookService.createTemplateContext(payload);
    const color = this.getColorForEvent(payload.event);

    const body: any[] = [
      // Header
      {
        type: 'Container',
        style: this.getStyleForEvent(payload.event),
        items: [
          {
            type: 'ColumnSet',
            columns: [
              {
                type: 'Column',
                width: 'auto',
                items: [
                  {
                    type: 'TextBlock',
                    text: '📊',
                    size: 'Large'
                  }
                ]
              },
              {
                type: 'Column',
                width: 'stretch',
                items: [
                  {
                    type: 'TextBlock',
                    text: context.title || payload.event,
                    weight: 'Bolder',
                    size: 'Large',
                    wrap: true
                  },
                  {
                    type: 'TextBlock',
                    text: `Event: ${payload.event}`,
                    isSubtle: true,
                    wrap: true
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    // Add message if present
    if (context.message) {
      body.push({
        type: 'TextBlock',
        text: context.message,
        wrap: true,
        spacing: 'Medium'
      });
    }

    // Add facts
    const facts = this.extractFacts(payload, context);
    if (facts.length > 0) {
      body.push({
        type: 'FactSet',
        facts: facts.map(f => ({ title: f.name, value: f.value })),
        spacing: 'Medium'
      });
    }

    // Add error details if present
    if ('error' in payload && payload.error) {
      body.push({
        type: 'Container',
        style: 'attention',
        items: [
          {
            type: 'TextBlock',
            text: '❌ Error Details',
            weight: 'Bolder',
            color: 'Attention'
          },
          {
            type: 'FactSet',
            facts: [
              { title: 'Message', value: payload.error.message || 'Unknown error' },
              { title: 'Type', value: (payload.error as any).name || 'Error' }
            ]
          }
        ],
        spacing: 'Medium'
      });
    }

    const actions: any[] = [];

    // Add action button if URL is provided
    if (context.url) {
      actions.push({
        type: 'Action.OpenUrl',
        title: 'View Details',
        url: context.url
      });
    }

    return {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.4',
            body,
            actions: actions.length > 0 ? actions : undefined
          }
        }
      ]
    };
  }

  /**
   * Extract key facts from payload for display
   */
  private extractFacts(payload: WebhookPayload, context: WebhookTemplateContext): TeamsFact[] {
    const facts: TeamsFact[] = [];

    // Add timestamp
    facts.push({
      name: '🕒 Time',
      value: new Date(payload.timestamp).toLocaleString()
    });

    // Add source if present
    if (context.source) {
      facts.push({
        name: '📍 Source',
        value: context.source
      });
    }

    // Add project if present
    if ('projectId' in payload && payload.projectId) {
      facts.push({
        name: '📁 Project',
        value: payload.projectId
      });
    }

    // Add data source if present
    if ('dataSourceId' in payload && payload.dataSourceId) {
      facts.push({
        name: '💾 Data Source',
        value: payload.dataSourceId
      });
    }

    // Add job info if present
    if ('jobId' in payload && payload.jobId) {
      facts.push({
        name: '⚙️ Job',
        value: payload.jobId
      });
    }

    // Add status if present
    if ('status' in payload && payload.status) {
      facts.push({
        name: '📊 Status',
        value: String(payload.status)
      });
    }

    // Add record count if present
    if ('recordCount' in payload && typeof payload.recordCount === 'number') {
      facts.push({
        name: '📈 Records',
        value: payload.recordCount.toLocaleString()
      });
    }

    // Add duration if present
    if ('duration' in payload && typeof payload.duration === 'number') {
      facts.push({
        name: '⏱️ Duration',
        value: `${payload.duration}ms`
      });
    }

    return facts;
  }

  /**
   * Get title for the message
   */
  private formatTitle(config: WebhookConfig, context: WebhookTemplateContext): string {
    if (config.templateConfig.title) {
      return this.interpolateTemplate(config.templateConfig.title, context);
    }
    return context.title || 'Manifold Notification';
  }

  /**
   * Get color based on event type
   */
  private getColorForEvent(event: string): string {
    // Teams theme colors in hex format
    if (event.includes('success') || event.includes('complete')) {
      return '28a745'; // Green
    }
    if (event.includes('error') || event.includes('fail')) {
      return 'dc3545'; // Red
    }
    if (event.includes('warning')) {
      return 'ffc107'; // Yellow
    }
    if (event.includes('start') || event.includes('processing')) {
      return '007bff'; // Blue
    }
    return '6c757d'; // Gray (default)
  }

  /**
   * Get style for Adaptive Card based on event
   */
  private getStyleForEvent(event: string): string {
    if (event.includes('success') || event.includes('complete')) {
      return 'good';
    }
    if (event.includes('error') || event.includes('fail')) {
      return 'attention';
    }
    if (event.includes('warning')) {
      return 'warning';
    }
    return 'default';
  }

  /**
   * Get emoji icon based on event type
   */
  private getIconForEvent(event: string): string {
    // Return emoji as data URL for Teams to display
    const emoji = this.getEmojiForEvent(event);
    // For simplicity, return empty string (Teams will use default)
    // In production, you could convert emoji to data URL or use actual image URLs
    return '';
  }

  /**
   * Get emoji for event type
   */
  private getEmojiForEvent(event: string): string {
    if (event.includes('success') || event.includes('complete')) return '✅';
    if (event.includes('error') || event.includes('fail')) return '❌';
    if (event.includes('warning')) return '⚠️';
    if (event.includes('start')) return '🚀';
    if (event.includes('processing')) return '⚙️';
    if (event.includes('data')) return '💾';
    if (event.includes('import')) return '📥';
    if (event.includes('export')) return '📤';
    return '📊';
  }

  /**
   * Interpolate template with context values
   */
  private interpolateTemplate(template: string, context: WebhookTemplateContext): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return String(context[key]) || match;
    });
  }
}
