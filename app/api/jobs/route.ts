import { NextRequest, NextResponse } from 'next/server';
import { SimpleSQLiteDB } from '../../../lib/server/database/SimpleSQLiteDB';
import { Job, JobStatus } from '../../../types';

let db: SimpleSQLiteDB;

async function ensureDb() {
  if (!db) {
    db = SimpleSQLiteDB.getInstance();
    await db.initialize();
  }
  return db;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    
    const database = await ensureDb();
    const jobs = database.getJobs(projectId);
    
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
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
    const job = database.createJob({
      projectId,
      name: jobData.name,
      pipelineId: jobData.pipelineId,
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
    const success = database.updateJob(id, updates);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
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
    const success = database.deleteJob(jobId);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}