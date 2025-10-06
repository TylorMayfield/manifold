import { NextRequest, NextResponse } from 'next/server';
import { MongoDatabase } from '../../../../../lib/server/database/MongoDatabase';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Snapshot Data API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Snapshot Data API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: snapshotId } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    console.log(`[Snapshot Data API] Loading data from snapshot ${snapshotId}: offset=${offset}, limit=${limit}`);
    
    const database = await ensureDb();
    
    // Get the snapshot to find the data source ID
    const snapshots = await database.getSnapshots('');
    const snapshot: any = snapshots.find((s: any) => s.id === snapshotId || s._id === snapshotId);
    
    if (!snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      );
    }
    
    const dataSourceId = snapshot.dataSourceId;
    
    // Load data from ImportedData collection
    const result = await database.getImportedData({
      dataSourceId,
      snapshotId,
      limit,
      offset,
    });
    
    console.log(`[Snapshot Data API] Loaded ${result.data.length} records from snapshot version ${snapshot.version}`);
    
    return NextResponse.json({
      data: result.data.map(item => item.data),
      totalCount: result.totalCount,
      snapshotId,
      version: snapshot.version,
      recordCount: snapshot.recordCount,
    });
    
  } catch (error) {
    console.error('Error loading snapshot data:', error);
    return NextResponse.json(
      { error: 'Failed to load snapshot data' },
      { status: 500 }
    );
  }
}

