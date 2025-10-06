import { NextRequest, NextResponse } from 'next/server';
import { rollbackManager } from '../../../../lib/services/RollbackManager';

/**
 * POST /api/rollback/points
 * Create a new rollback point
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      name,
      description,
      type = 'manual',
      scope,
      expiresInDays,
      createdBy,
    } = body;

    console.log(`[Rollback] Creating rollback point: ${name}`);

    if (!name || !scope || !scope.projectId) {
      return NextResponse.json(
        { error: 'Name and scope.projectId are required' },
        { status: 400 }
      );
    }

    const rollbackPoint = await rollbackManager.createRollbackPoint({
      name,
      description,
      type,
      scope,
      expiresInDays,
      createdBy,
    });

    return NextResponse.json({
      success: true,
      rollbackPoint,
    });

  } catch (error) {
    console.error('[Rollback] Create rollback point error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create rollback point',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rollback/points
 * Get all rollback points with optional filters
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: any = {};
    if (searchParams.get('projectId')) filters.projectId = searchParams.get('projectId');
    if (searchParams.get('type')) filters.type = searchParams.get('type');
    if (searchParams.get('status')) filters.status = searchParams.get('status');
    if (searchParams.get('dataSourceId')) filters.dataSourceId = searchParams.get('dataSourceId');

    const rollbackPoints = rollbackManager.getRollbackPoints(filters);

    return NextResponse.json({
      rollbackPoints,
      count: rollbackPoints.length,
    });

  } catch (error) {
    console.error('[Rollback] Get rollback points error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get rollback points',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

