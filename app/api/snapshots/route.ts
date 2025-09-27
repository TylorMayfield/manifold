import { NextRequest, NextResponse } from 'next/server';
import { SimpleSQLiteDB } from '../../../lib/server/database/SimpleSQLiteDB';

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
    const dataSourceId = searchParams.get('dataSourceId');
    
    const database = await ensureDb();
    const snapshots = database.getSnapshots(projectId, dataSourceId || undefined);
    
    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId = 'default', ...snapshotData } = body;
    
    const database = await ensureDb();
    
    // Create snapshot
    const snapshot = database.createSnapshot(projectId, snapshotData);
    
    return NextResponse.json(snapshot, { status: 201 });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const snapshotId = searchParams.get('snapshotId');
    
    if (!snapshotId) {
      return NextResponse.json(
        { error: 'snapshotId is required' },
        { status: 400 }
      );
    }
    
    const database = await ensureDb();
    const success = database.deleteSnapshot(snapshotId);
    
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to delete snapshot' },
      { status: 500 }
    );
  }
}
