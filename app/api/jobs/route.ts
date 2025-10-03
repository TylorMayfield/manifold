import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../lib/server/database/MongoDatabase';
import { Job, JobStatus } from '../../../types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Jobs API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Jobs API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    const status = searchParams.get('status');
    
    const database = await ensureDb();
    let jobs = await database.getJobs(projectId);
    
    // Filter by status if provided
    if (status) {
      jobs = jobs.filter((job: any) => job.status === status);
    }
    
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId = 'default', ...jobData } = body;
    
    const database = await ensureDb();
    
    // Create job
    const job = await database.createJob({
      projectId,
      name: jobData.name,
      type: jobData.type,
      pipelineId: jobData.pipelineId,
      dataSourceId: jobData.dataSourceId,
      schedule: jobData.schedule,
      enabled: jobData.enabled !== undefined ? jobData.enabled : true
    });
    
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Job id is required' },
        { status: 400 }
      );
    }
    
    const database = await ensureDb();
    const result = await database.updateJob(id, updates);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId is required' },
        { status: 400 }
      );
    }
    
    const database = await ensureDb();
    const success = await database.deleteJob(jobId);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}