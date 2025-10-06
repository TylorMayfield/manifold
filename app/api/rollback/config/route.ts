import { NextRequest, NextResponse } from 'next/server';
import { rollbackManager } from '../../../../lib/services/RollbackManager';

/**
 * GET /api/rollback/config
 * Get rollback configuration
 */
export async function GET(): Promise<NextResponse> {
  try {
    const config = rollbackManager.getConfig();

    return NextResponse.json({ config });

  } catch (error) {
    console.error('[Rollback] Get config error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get rollback configuration',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rollback/config
 * Update rollback configuration
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    console.log('[Rollback] Updating configuration');

    rollbackManager.updateConfig(body);

    return NextResponse.json({
      success: true,
      config: rollbackManager.getConfig(),
    });

  } catch (error) {
    console.error('[Rollback] Update config error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update rollback configuration',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

