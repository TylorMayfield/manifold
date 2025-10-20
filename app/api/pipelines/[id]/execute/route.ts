import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../../lib/server/database/MongoDatabase';
import { pipelineExecutor, ExecutionContext } from '../../../../../lib/services/PipelineExecutor';
import { integrationHub } from '../../../../../lib/services/IntegrationHub';
import { v4 as uuidv4 } from 'uuid';

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
 * POST /api/pipelines/[id]/execute
 * Execute a pipeline with specified data sources
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const pipelineId = params.id;
    const body = await request.json();
    const { sourceIds, userId } = body;

    console.log(`[Pipeline Execute] Starting execution for pipeline: ${pipelineId}`);

    // Get pipeline
    const database = await ensureDb();
    const pipeline: any = await database.getPipeline(pipelineId);

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Load data from specified sources (or use pipeline's input sources)
    const sourcesToLoad = sourceIds || pipeline.inputSourceIds || [];
    
    if (sourcesToLoad.length === 0) {
      return NextResponse.json(
        { error: 'No data sources specified for pipeline execution' },
        { status: 400 }
      );
    }

    console.log(`[Pipeline Execute] Loading data from ${sourcesToLoad.length} source(s)`);

    // Load data from each source
    const inputData: Record<string, any[]> = {};
    
    for (const sourceId of sourcesToLoad) {
      try {
        // Get latest snapshot for this source
        const snapshots = await database.getSnapshots(sourceId);
        
        if (snapshots.length === 0) {
          console.warn(`[Pipeline Execute] No snapshots found for source: ${sourceId}`);
          inputData[sourceId] = [];
          continue;
        }

        // Use the latest snapshot
        const latestSnapshot: any = snapshots[0]; // Already sorted by version descending

        // Load data
        const importedDataResult = await database.getImportedData({
          dataSourceId: sourceId,
          snapshotId: latestSnapshot.id as string,
          limit: 100000, // Large limit for pipeline execution
        });
        
        inputData[sourceId] = importedDataResult.data;
        
        console.log(`[Pipeline Execute] Loaded ${inputData[sourceId].length} records from source: ${sourceId}`);
      } catch (error) {
        console.error(`[Pipeline Execute] Error loading source ${sourceId}:`, error);
        inputData[sourceId] = [];
      }
    }

    // Create execution context
    const executionContext: ExecutionContext = {
      executionId: uuidv4(),
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      projectId: 'default',
      startTime: new Date(),
      userId,
    };

    console.log(`[Pipeline Execute] Starting execution: ${executionContext.executionId}`);

    // Execute pipeline (run in background but return immediately)
    // For now, we'll execute synchronously, but this could be moved to a queue
    const result = await pipelineExecutor.executePipeline(
      pipeline,
      inputData,
      executionContext
    );

    console.log(`[Pipeline Execute] Execution completed: ${result.status}`);
    console.log(`[Pipeline Execute] Input: ${result.inputRecords} records, Output: ${result.outputRecords} records`);

    // Integration Hub: Track execution, update lineage
    try {
      console.log('[Pipeline Execute] Notifying Integration Hub of execution...');
      await integrationHub.onPipelineExecuted(
        result.pipelineId,
        result.executionId,
        result.status === 'completed'
      );
      console.log('[Pipeline Execute] Integration Hub notification complete');
    } catch (hubError) {
      console.warn('[Pipeline Execute] Integration Hub notification failed (non-critical):', hubError);
    }

    // Store execution result in database
    try {
      await database.storePipelineExecution({
        id: result.executionId,
        pipelineId: result.pipelineId,
        projectId: 'default',
        status: result.status,
        startTime: result.startTime,
        endTime: result.endTime,
        duration: result.duration,
        inputRecords: result.inputRecords,
        outputRecords: result.outputRecords,
        recordsProcessed: result.recordsProcessed,
        steps: result.steps,
        error: result.error,
      });
      console.log(`[Pipeline Execute] Execution result stored in database`);
    } catch (dbError) {
      console.error('[Pipeline Execute] Failed to store execution result:', dbError);
      // Continue anyway - execution completed successfully
    }

    return NextResponse.json({
      success: true,
      execution: result,
    });

  } catch (error) {
    console.error('[Pipeline Execute] Execution error:', error);
    
    return NextResponse.json(
      {
        error: 'Pipeline execution failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

