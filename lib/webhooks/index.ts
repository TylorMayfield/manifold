import { webhookService } from '../services/WebhookService';
import { SlackAdapter } from '../adapters/SlackAdapter';
import { DiscordAdapter } from '../adapters/DiscordAdapter';
import { TeamsAdapter } from '../adapters/TeamsAdapter';
import { GenericAdapter } from '../adapters/GenericAdapter';

// Initialize adapters
const slackAdapter = new SlackAdapter(webhookService);
const discordAdapter = new DiscordAdapter(webhookService);
const teamsAdapter = new TeamsAdapter(webhookService);
const genericAdapter = new GenericAdapter(webhookService);

// Register all adapters
webhookService.registerAdapter(slackAdapter);
webhookService.registerAdapter(discordAdapter);
webhookService.registerAdapter(teamsAdapter);
webhookService.registerAdapter(genericAdapter);

// Export everything for easy use
export {
  webhookService,
  slackAdapter,
  discordAdapter,
  teamsAdapter,
  genericAdapter
};

// Export types
export * from '../types/webhook';

// Export adapters and service classes
export { WebhookService } from '../services/WebhookService';
export { SlackAdapter } from '../adapters/SlackAdapter';
export { DiscordAdapter } from '../adapters/DiscordAdapter';
export { TeamsAdapter } from '../adapters/TeamsAdapter';
export { GenericAdapter } from '../adapters/GenericAdapter';

// Helper functions for common webhook operations
export const createTestPayload = (name: string = 'Test Webhook') => ({
  event: 'start' as const,
  timestamp: new Date().toISOString(),
  name,
  description: 'This is a test webhook notification from Manifold ETL'
});

export const getAvailableAdapterTypes = () => ['slack', 'discord', 'teams', 'webhook'];

export default webhookService;