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

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const pipelineId = params.id;

    const database = await ensureDb();
    const pipeline = await database.getPipeline(pipelineId);

    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }

    return NextResponse.json(pipeline);
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}


