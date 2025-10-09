import { NextRequest, NextResponse } from 'next/server';

async function ensureDb() {
  const { MongoDatabase } = await import('../../../../lib/server/database/MongoDatabase');
  const db = MongoDatabase.getInstance();
  await db.initialize();
  return db;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const projectId: string = body.projectId || 'default';
    const dataSourceId: string | undefined = body.dataSourceId || undefined;
    const keep: number = Math.max(0, Number(body.keep ?? 5));

    if (!dataSourceId) {
      return NextResponse.json(
        { error: 'dataSourceId is required' },
        { status: 400 }
      );
    }

    const db = await ensureDb();

    // Load snapshots for the specified data source
    const snapshots = await db.getSnapshots(dataSourceId);

    // Sort by version desc (db already returns sorted desc by version, but ensure it)
    const sorted = [...snapshots].sort((a: any, b: any) => (b.version || 0) - (a.version || 0));

    // Determine snapshots to delete
    const toDelete = keep > 0 ? sorted.slice(keep) : sorted;

    for (const snap of toDelete) {
      await db.deleteSnapshot(String(snap.id));
    }

    return NextResponse.json({
      success: true,
      deletedCount: toDelete.length,
      keptCount: Math.min(keep, sorted.length),
      totalBefore: sorted.length,
      dataSourceId,
      projectId,
    });
  } catch (error) {
    console.error('Error cleaning up snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup snapshots' },
      { status: 500 }
    );
  }
}


