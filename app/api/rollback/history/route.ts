import { NextRequest, NextResponse } from 'next/server';
import { rollbackManager } from '../../../../lib/services/RollbackManager';

/**
 * GET /api/rollback/history
 * Get rollback operation history
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: any = {};
    if (searchParams.get('rollbackPointId')) {
      filters.rollbackPointId = searchParams.get('rollbackPointId');
    }
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status');
    }
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }

    const history = rollbackManager.getRollbackHistory(filters);

    return NextResponse.json({
      history,
      count: history.length,
    });

  } catch (error) {
    console.error('[Rollback] Get history error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get rollback history',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

