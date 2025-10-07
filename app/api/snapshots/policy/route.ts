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

// PUT /api/snapshots/policy?dataSourceId=...
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataSourceId = searchParams.get('dataSourceId');
    if (!dataSourceId) {
      return NextResponse.json({ error: 'dataSourceId is required' }, { status: 400 });
    }

    const body = await request.json();
    const database = await ensureDb();
    if (!database.isHealthy()) {
      return NextResponse.json({ error: 'Database not ready' }, { status: 503 });
    }

    // Update snapshot policy on data source document
    const updated = await database.updateDataSource(dataSourceId, { snapshotPolicy: body });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update snapshot policy:', error);
    return NextResponse.json({ error: 'Failed to update snapshot policy' }, { status: 500 });
  }
}


