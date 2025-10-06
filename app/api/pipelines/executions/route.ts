import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../lib/server/database/MongoDatabase';

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

/**
 * GET /api/pipelines/executions
 * Get all pipeline executions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const pipelineId = searchParams.get('pipelineId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const database = await ensureDb();
    
    // Get executions from database
    let executions = await database.getPipelineExecutions(projectId);

    // Apply filters
    if (pipelineId) {
      executions = executions.filter(e => e.pipelineId === pipelineId);
    }

    if (status) {
      executions = executions.filter(e => e.status === status);
    }

    // Sort by start time (newest first)
    executions.sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // Apply limit
    if (limit > 0) {
      executions = executions.slice(0, limit);
    }

    return NextResponse.json({
      executions,
      total: executions.length,
    });

  } catch (error) {
    console.error('[Pipeline Executions] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get pipeline executions',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

