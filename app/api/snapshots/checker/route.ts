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

interface DataSourceWithPolicy {
  id: string;
  projectId?: string;
  snapshotPolicy?: {
    keepLast?: number;
    maxAgeDays?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const projectId: string = body.projectId || 'default';
    const dryRun: boolean = body.dryRun !== false; // default true

    const database = await ensureDb();
    // @ts-ignore
    if (typeof (database as any).isHealthy === 'function' && !(database as any).isHealthy()) {
      return NextResponse.json({ success: false, error: 'Database not ready' }, { status: 503 });
    }

    // Load data sources for project
    // Note: getDataSources signature may vary; fallback to all sources and filter
    // @ts-ignore
    const allSources = await (database.getDataSources ? database.getDataSources(projectId) : database.getDataSources());
    const dataSources: DataSourceWithPolicy[] = Array.isArray(allSources)
      ? allSources
          .filter((s: any) => !projectId || s.projectId === projectId)
          .map((s: any) => ({ ...s, id: String(s.id) }))
      : [];

    const now = Date.now();
    const actions: Array<{ dataSourceId: string; keep: string[]; delete: string[]; policy: any }> = [];

    for (const source of dataSources) {
      const policy = source.snapshotPolicy || {};
      if (!policy.keepLast && !policy.maxAgeDays) continue;

      const snapshots = await database.getSnapshots(source.id);
      // snapshots already sorted by version desc in DB layer
      const keepSet = new Set<string>();
      const deleteIds: string[] = [];

      // keepLast
      if (policy.keepLast && policy.keepLast > 0) {
        snapshots.slice(0, policy.keepLast).forEach((snap: any) => keepSet.add(snap.id));
      }

      // maxAgeDays
      if (policy.maxAgeDays && policy.maxAgeDays > 0) {
        const cutoff = now - policy.maxAgeDays * 24 * 60 * 60 * 1000;
        snapshots.forEach((snap: any) => {
          const created = new Date(snap.createdAt).getTime();
          if (created < cutoff && !keepSet.has(snap.id)) {
            deleteIds.push(snap.id);
          }
        });
      }

      // If only keepLast specified and no maxAgeDays
      if (policy.keepLast && policy.keepLast > 0 && !policy.maxAgeDays) {
        snapshots.slice(policy.keepLast).forEach((snap: any) => {
          if (!keepSet.has(snap.id)) deleteIds.push(snap.id);
        });
      }

      // Ensure non-negative
      const uniqueDelete = Array.from(new Set(deleteIds));
      const keepIds = snapshots.filter((s: any) => !uniqueDelete.includes(s.id)).map((s: any) => s.id);

      actions.push({ dataSourceId: source.id, keep: keepIds, delete: uniqueDelete, policy });

      if (!dryRun) {
        for (const snapId of uniqueDelete) {
          await database.deleteSnapshot(snapId);
        }
      }
    }

    return NextResponse.json({ success: true, dryRun, actions });
  } catch (error) {
    console.error('Snapshot Checker error:', error);
    return NextResponse.json({ success: false, error: 'Snapshot checker failed' }, { status: 500 });
  }
}


