import { NextRequest, NextResponse } from 'next/server';
import { bulkOperations } from '../../../../../../lib/services/BulkOperations';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/bulk/operations/[id]/cancel
 * Cancel a bulk operation
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const operationId = params.id;

    console.log(`[Bulk Operations] Cancelling operation: ${operationId}`);

    const cancelled = bulkOperations.cancelOperation(operationId);

    if (cancelled) {
      return NextResponse.json({
        success: true,
        message: 'Operation cancelled',
      });
    } else {
      return NextResponse.json(
        {
          error: 'Could not cancel operation',
          message: 'Operation not found or not running',
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('[Bulk Operations] Cancel operation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to cancel bulk operation',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

