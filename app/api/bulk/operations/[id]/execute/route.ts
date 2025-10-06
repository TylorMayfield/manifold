import { NextRequest, NextResponse } from 'next/server';
import { bulkOperations } from '../../../../../../lib/services/BulkOperations';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/bulk/operations/[id]/execute
 * Execute a bulk operation
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const operationId = params.id;

    console.log(`[Bulk Operations] Executing operation: ${operationId}`);

    const summary = await bulkOperations.executeOperation(operationId);

    return NextResponse.json({
      success: true,
      summary,
    });

  } catch (error) {
    console.error('[Bulk Operations] Execute operation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to execute bulk operation',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

