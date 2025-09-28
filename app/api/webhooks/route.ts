import { NextRequest, NextResponse } from 'next/server';
import { 
  CreateWebhookSchema, 
  GetWebhooksQuerySchema,
  type CreateWebhookRequest,
  type WebhookConfig 
} from '../../../lib/validation/webhook';
import { webhookService } from '../../../lib/webhooks';

// Mock database functions - replace with actual database calls
async function getWebhooks(filters: any = {}): Promise<WebhookConfig[]> {
  // This would query the webhook_configs table
  // For now, return mock data
  return [];
}

async function createWebhook(data: CreateWebhookRequest): Promise<WebhookConfig> {
  // This would insert into webhook_configs table
  const webhook: WebhookConfig = {
    id: `webhook_${Date.now()}`,
    ...data,
    headers: data.headers || {},
    templateConfig: data.templateConfig || {},
    events: data.events || ['start', 'success', 'failure', 'complete'],
    isEnabled: data.isEnabled ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save to database here
  console.log('Creating webhook:', webhook);
  
  return webhook;
}

// GET /api/webhooks - List webhooks with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Convert string parameters to appropriate types
    const parsedParams: any = { ...queryParams };
    if (parsedParams.isEnabled !== undefined) {
      parsedParams.isEnabled = parsedParams.isEnabled === 'true';
    }
    
    const validatedQuery = GetWebhooksQuerySchema.parse(parsedParams);
    const webhooks = await getWebhooks(validatedQuery);
    
    return NextResponse.json({
      success: true,
      data: webhooks,
      count: webhooks.length
    });
    
  } catch (error) {
    console.error('GET /api/webhooks error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhooks'
    }, { status: 500 });
  }
}

// POST /api/webhooks - Create new webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateWebhookSchema.parse(body);
    
    // Validate webhook configuration with the service
    const validation = await webhookService.validateConfig(validatedData as any);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid webhook configuration',
        details: validation.errors
      }, { status: 400 });
    }
    
    const webhook = await createWebhook(validatedData);
    
    return NextResponse.json({
      success: true,
      data: webhook
    }, { status: 201 });
    
  } catch (error) {
    console.error('POST /api/webhooks error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body',
        details: error
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create webhook'
    }, { status: 500 });
  }
}