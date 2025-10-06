import { NextRequest, NextResponse } from 'next/server';
import { rollbackManager } from '../../../../lib/services/RollbackManager';

/**
 * POST /api/rollback/restore
 * Restore data from a rollback point
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      rollbackPointId,
      reason,
      initiatedBy,
      dryRun = false,
    } = body;

    console.log(`[Rollback] Starting restore operation: ${rollbackPointId}`);

    if (!rollbackPointId) {
      return NextResponse.json(
        { error: 'rollbackPointId is required' },
        { status: 400 }
      );
    }

    const operation = await rollbackManager.restoreFromRollbackPoint({
      rollbackPointId,
      reason,
      initiatedBy,
      dryRun,
    });

    return NextResponse.json({
      success: operation.status === 'completed',
      operation,
    });

  } catch (error) {
    console.error('[Rollback] Restore operation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to restore from rollback point',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

