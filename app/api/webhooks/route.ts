import { NextRequest, NextResponse } from 'next/server';
import { 
  CreateWebhookSchema, 
  GetWebhooksQuerySchema,
  type CreateWebhookRequest,
  type WebhookConfig 
} from '../../../lib/validation/webhook';
import { webhookService } from '../../../lib/webhooks';
import { MongoDatabase } from '../../../lib/server/database/MongoDatabase';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Webhooks API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Webhooks API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

async function getWebhooks(filters: any = {}): Promise<WebhookConfig[]> {
  const database = await ensureDb();
  // Graceful fallback if DB isn't ready yet
  // @ts-ignore access health guard
  if (typeof (database as any).isHealthy === 'function' && !(database as any).isHealthy()) {
    return [] as any[];
  }
  const webhooks = await database.getWebhooks(filters.projectId);
  return webhooks as any[];
}

async function createWebhook(data: CreateWebhookRequest): Promise<WebhookConfig> {
  const database = await ensureDb();
  
  const webhook = await database.createWebhook(data.projectId || 'default', {
    name: data.name,
    url: data.url,
    events: data.events || ['start', 'success', 'failure', 'complete'],
    enabled: data.isEnabled ?? true
  });
  
  return webhook as any;
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