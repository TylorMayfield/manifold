import { NextRequest, NextResponse } from 'next/server';
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
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const jobId = params.id;

    const database = await ensureDb();
    // @ts-ignore
    if (typeof (database as any).isHealthy === 'function' && !(database as any).isHealthy()) {
      return NextResponse.json({ error: 'Database not ready' }, { status: 503 });
    }

    const jobs = await database.getJob(jobId);
    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    const job = jobs[0];

    // If job has a pipelineId, execute the pipeline
    if (job.pipelineId) {
      const pipelineResp = await fetch(`${request.nextUrl.origin}/api/pipelines/${job.pipelineId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: 'job', jobId })
      });
      const pipelineResult = await pipelineResp.json();
      
      // Update job last run
      await database.updateJob(jobId, { lastRun: new Date(), status: pipelineResp.ok ? 'completed' : 'failed' });
      
      return NextResponse.json({ success: pipelineResp.ok, result: pipelineResult });
    }

    // Fallback: mark as run without actual execution
    await database.updateJob(jobId, { lastRun: new Date(), status: 'completed' });
    return NextResponse.json({ success: true, message: 'Job executed (no pipeline linked)' });
  } catch (error) {
    console.error('Error executing job:', error);
    return NextResponse.json({ error: 'Failed to execute job' }, { status: 500 });
  }
}

