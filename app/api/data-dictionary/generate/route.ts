import { NextRequest, NextResponse } from "next/server";
import { dataDictionaryService } from "../../../../lib/services/DataDictionaryService";
import { MongoDatabase } from "../../../../lib/server/database/MongoDatabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

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

/**
 * POST /api/data-dictionary/generate
 * Auto-generate dictionary entry from a data source
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dataSourceId, projectId } = body;

    if (!dataSourceId || !projectId) {
      return NextResponse.json(
        { error: "dataSourceId and projectId are required" },
        { status: 400 }
      );
    }

    const database = await ensureDb();

    // Get data source
    const dataSource = await database.getDataSource(dataSourceId);
    if (!dataSource) {
      return NextResponse.json(
        { error: "Data source not found" },
        { status: 404 }
      );
    }

    // Get latest snapshot
    const snapshots = await database.getSnapshots(dataSourceId);
    const latestSnapshot = snapshots.length > 0 ? snapshots[0] as any : undefined;

    // Generate dictionary entry
    const entry = await dataDictionaryService.generateFromDataSource(
      dataSource as any,
      latestSnapshot
    );

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/data-dictionary/generate:", error);
    return NextResponse.json(
      { error: "Failed to generate dictionary entry" },
      { status: 500 }
    );
  }
}

