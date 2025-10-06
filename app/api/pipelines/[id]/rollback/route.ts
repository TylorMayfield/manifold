import { NextRequest, NextResponse } from 'next/server';
import { rollbackManager } from '../../../../../lib/services/RollbackManager';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/pipelines/[id]/rollback
 * Rollback a failed pipeline execution
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const pipelineId = params.id;
    const body = await request.json();
    const {
      executionId,
      projectId,
      reason,
      initiatedBy,
    } = body;

    console.log(`[Rollback] Rolling back failed pipeline: ${pipelineId}`);

    if (!executionId || !projectId) {
      return NextResponse.json(
        { error: 'executionId and projectId are required' },
        { status: 400 }
      );
    }

    const operation = await rollbackManager.rollbackFailedPipeline({
      executionId,
      pipelineId,
      projectId,
      reason: reason || 'Pipeline execution failed',
      initiatedBy,
    });

    return NextResponse.json({
      success: operation.status === 'completed',
      operation,
    });

  } catch (error) {
    console.error('[Rollback] Pipeline rollback error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to rollback pipeline',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

