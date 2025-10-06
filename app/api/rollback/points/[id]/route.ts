import { NextRequest, NextResponse } from 'next/server';
import { rollbackManager } from '../../../../../lib/services/RollbackManager';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/rollback/points/[id]
 * Get a specific rollback point
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const rollbackPointId = params.id;

    const rollbackPoint = rollbackManager.getRollbackPoint(rollbackPointId);

    if (!rollbackPoint) {
      return NextResponse.json(
        { error: 'Rollback point not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ rollbackPoint });

  } catch (error) {
    console.error('[Rollback] Get rollback point error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get rollback point',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rollback/points/[id]
 * Delete a rollback point
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const rollbackPointId = params.id;

    console.log(`[Rollback] Deleting rollback point: ${rollbackPointId}`);

    const deleted = rollbackManager.deleteRollbackPoint(rollbackPointId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Rollback point not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Rollback point deleted',
    });

  } catch (error) {
    console.error('[Rollback] Delete rollback point error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to delete rollback point',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

