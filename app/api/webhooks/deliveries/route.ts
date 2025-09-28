import { NextRequest, NextResponse } from 'next/server';
import { 
  GetDeliveriesQuerySchema,
  type WebhookDelivery 
} from '../../../../lib/validation/webhook';

// Mock database function - replace with actual database call
async function getWebhookDeliveries(filters: any = {}): Promise<{ deliveries: WebhookDelivery[], total: number }> {
  // This would query the webhook_deliveries table
  console.log('Getting webhook deliveries:', filters);
  
  // Mock delivery data
  const mockDeliveries: WebhookDelivery[] = [
    {
      id: 'delivery_1',
      webhookConfigId: 'webhook_1',
      eventType: 'start',
      payload: JSON.stringify({
        event: 'start',
        timestamp: new Date().toISOString(),
        name: 'Test Pipeline',
        description: 'Test pipeline execution'
      }),
      status: 'success',
      httpStatus: 200,
      responseBody: 'OK',
      attemptCount: 1,
      deliveredAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 60000).toISOString() // 1 minute ago
    },
    {
      id: 'delivery_2',
      webhookConfigId: 'webhook_1',
      eventType: 'failure',
      payload: JSON.stringify({
        event: 'failure',
        timestamp: new Date().toISOString(),
        name: 'Failed Pipeline',
        error: { message: 'Database connection failed' }
      }),
      status: 'failed',
      httpStatus: 500,
      errorMessage: 'HTTP 500: Internal Server Error',
      attemptCount: 3,
      createdAt: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
    }
  ];
  
  // Apply filters
  let filteredDeliveries = mockDeliveries;
  
  if (filters.webhookId) {
    filteredDeliveries = filteredDeliveries.filter(d => d.webhookConfigId === filters.webhookId);
  }
  
  if (filters.status) {
    filteredDeliveries = filteredDeliveries.filter(d => d.status === filters.status);
  }
  
  // Apply pagination
  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  const paginatedDeliveries = filteredDeliveries.slice(offset, offset + limit);
  
  return {
    deliveries: paginatedDeliveries,
    total: filteredDeliveries.length
  };
}

// GET /api/webhooks/deliveries - List webhook deliveries with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Convert string parameters to appropriate types
    const parsedParams: any = { ...queryParams };
    if (parsedParams.limit !== undefined) {
      parsedParams.limit = parseInt(parsedParams.limit);
    }
    if (parsedParams.offset !== undefined) {
      parsedParams.offset = parseInt(parsedParams.offset);
    }
    
    const validatedQuery = GetDeliveriesQuerySchema.parse(parsedParams);
    const { deliveries, total } = await getWebhookDeliveries(validatedQuery);
    
    return NextResponse.json({
      success: true,
      data: deliveries,
      pagination: {
        total,
        count: deliveries.length,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore: (validatedQuery.offset + deliveries.length) < total
      }
    });
    
  } catch (error) {
    console.error('GET /api/webhooks/deliveries error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: error
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch webhook deliveries'
    }, { status: 500 });
  }
}