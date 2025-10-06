import { NextRequest, NextResponse } from 'next/server';
import { bulkOperations, BulkEntityType, BulkOperationType } from '../../../../lib/services/BulkOperations';

/**
 * POST /api/bulk/operations
 * Create a bulk operation
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const operation = bulkOperations.createOperation({
      name: body.name,
      entityType: body.entityType as BulkEntityType,
      operationType: body.operationType as BulkOperationType,
      entityIds: body.entityIds,
      config: body.config,
      options: body.options,
    });

    console.log(`[Bulk Operations] Created operation: ${operation.name}`);

    return NextResponse.json({
      success: true,
      operation,
    });

  } catch (error) {
    console.error('[Bulk Operations] Create operation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create bulk operation',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bulk/operations
 * Get all bulk operations
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let operations = bulkOperations.getAllOperations();
    
    // Filter by status if provided
    if (status) {
      operations = operations.filter(op => op.status === status);
    }

    const statistics = bulkOperations.getStatistics();

    return NextResponse.json({
      success: true,
      operations,
      statistics,
      total: operations.length,
    });

  } catch (error) {
    console.error('[Bulk Operations] Get operations error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get bulk operations',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

