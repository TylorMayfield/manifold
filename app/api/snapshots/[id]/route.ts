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
  params: Promise<{
    id: string;
  }>;
}

/**
 * DELETE /api/snapshots/[id]
 * Delete a specific snapshot
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const snapshotId = params.id;
    
    if (!snapshotId) {
      return NextResponse.json(
        { error: 'Snapshot ID is required' },
        { status: 400 }
      );
    }
    
    const database = await ensureDb();
    
    // Delete the snapshot from MongoDB
    const success = await database.deleteSnapshot(snapshotId);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Snapshot not found or could not be deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Snapshot deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete snapshot',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/snapshots/[id]
 * Get a specific snapshot
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const snapshotId = params.id;
    
    const database = await ensureDb();
    
    const snapshot = await database.getSnapshot(snapshotId);
    
    if (!snapshot) {
      return NextResponse.json(
        { error: 'Snapshot not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error('Error fetching snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshot' },
      { status: 500 }
    );
  }
}

