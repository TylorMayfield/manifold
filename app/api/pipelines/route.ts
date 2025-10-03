import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../lib/server/database/MongoDatabase';
import { Pipeline } from '../../../types';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Pipelines API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Pipelines API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';
    
    const database = await ensureDb();
    const pipelines = await database.getPipelines(projectId);
    
    return NextResponse.json(pipelines);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId = 'default', ...pipelineData } = body;
    
    const database = await ensureDb();
    
    // Create pipeline
    const pipeline = await database.createPipeline(projectId, pipelineData);
    
    return NextResponse.json(pipeline, { status: 201 });
  } catch (error) {
    console.error('Error creating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
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
        { error: 'Pipeline id is required' },
        { status: 400 }
      );
    }
    
    const database = await ensureDb();
    const updated = await database.updatePipeline(id, updates);
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to update pipeline' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('pipelineId');
    
    if (!pipelineId) {
      return NextResponse.json(
        { error: 'pipelineId is required' },
        { status: 400 }
      );
    }
    
    const database = await ensureDb();
    const success = await database.deletePipeline(pipelineId);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline' },
      { status: 500 }
    );
  }
}