import { webhookService } from '../services/WebhookService';
import { SlackAdapter } from '../adapters/SlackAdapter';
import { DiscordAdapter } from '../adapters/DiscordAdapter';
import { GenericAdapter } from '../adapters/GenericAdapter';

// Initialize adapters
const slackAdapter = new SlackAdapter(webhookService);
const discordAdapter = new DiscordAdapter(webhookService);
const genericAdapter = new GenericAdapter(webhookService);

// Register all adapters
webhookService.registerAdapter(slackAdapter);
webhookService.registerAdapter(discordAdapter);
webhookService.registerAdapter(genericAdapter);

// Export everything for easy use
export {
  webhookService,
  slackAdapter,
  discordAdapter,
  genericAdapter
};

// Export types
export * from '../types/webhook';

// Export adapters and service classes
export { WebhookService } from '../services/WebhookService';
export { SlackAdapter } from '../adapters/SlackAdapter';
export { DiscordAdapter } from '../adapters/DiscordAdapter';
export { GenericAdapter } from '../adapters/GenericAdapter';

// Helper functions for common webhook operations
export const createTestPayload = (name: string = 'Test Webhook') => ({
  event: 'start' as const,
  timestamp: new Date().toISOString(),
  name,
  description: 'This is a test webhook notification from Manifold ETL'
});

export const getAvailableAdapterTypes = () => ['slack', 'discord', 'webhook'];

export default webhookService;