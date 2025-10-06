import { NextRequest, NextResponse } from 'next/server';
import { pipelineExecutor } from '../../../../../lib/services/PipelineExecutor';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/pipelines/[id]/status
 * Get the status of a pipeline execution
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const executionId = params.id;

    // Get execution from executor
    const execution = pipelineExecutor.getExecution(executionId);

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      execution,
    });

  } catch (error) {
    console.error('[Pipeline Status] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get execution status',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

