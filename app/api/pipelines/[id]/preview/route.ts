import { NextRequest, NextResponse } from 'next/server';
import { pipelinePreview } from '../../../../../lib/services/PipelinePreview';
import { MongoDatabase } from '../../../../../lib/server/database/MongoDatabase';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    return instance;
  })();
  
  return initPromise;
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/pipelines/[id]/preview
 * Generate live preview for pipeline transformations
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const pipelineId = params.id;
    const body = await request.json();

    console.log(`[Pipeline Preview] Generating preview for: ${pipelineId}`);

    // Get pipeline
    const database = await ensureDb();
    const pipeline: any = await database.getPipeline(pipelineId);

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Generate preview
    const result = await pipelinePreview.generatePreview({
      pipeline,
      stepIndex: body.stepIndex,
      sampleSize: body.sampleSize || 100,
      inputData: body.inputData,
    });

    return NextResponse.json({
      success: true,
      preview: result,
    });

  } catch (error) {
    console.error('[Pipeline Preview] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate preview',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

