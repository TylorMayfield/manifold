import { NextRequest, NextResponse } from 'next/server';
import { rollbackManager } from '../../../../lib/services/RollbackManager';

/**
 * GET /api/rollback/statistics
 * Get rollback system statistics
 */
export async function GET(): Promise<NextResponse> {
  try {
    const statistics = rollbackManager.getStatistics();

    return NextResponse.json({ statistics });

  } catch (error) {
    console.error('[Rollback] Get statistics error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get rollback statistics',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

