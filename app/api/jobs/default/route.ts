import { NextRequest, NextResponse } from "next/server";
import { DefaultJobsService } from "../../../../lib/services/DefaultJobsService";
import { MongoDatabase } from "../../../../lib/server/database/MongoDatabase";

// Force dynamic rendering to avoid build-time database initialization
export const dynamic = 'force-dynamic';

let defaultJobsService: DefaultJobsService | null = null;
let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Default Jobs API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Default Jobs API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

function getJobsService() {
  if (!defaultJobsService) {
    defaultJobsService = new DefaultJobsService();
  }
  return defaultJobsService;
}

export async function GET(request: NextRequest) {
  try {
    // Ensure database is initialized first
    const database = await ensureDb();
    
    if (!database.isHealthy()) {
      return NextResponse.json(
        { error: "Database not ready" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return await getJobStatus();
      case 'create':
        return await createDefaultJobs();
      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'status' or 'create'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Default jobs API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure database is initialized first
    const database = await ensureDb();
    
    if (!database.isHealthy()) {
      return NextResponse.json(
        { error: "Database not ready" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { action, jobType } = body;

    switch (action) {
      case 'run':
        if (!jobType || !['backup', 'integrity_check'].includes(jobType)) {
          return NextResponse.json(
            { error: "Invalid jobType. Use 'backup' or 'integrity_check'" },
            { status: 400 }
          );
        }
        return await runJobManually(jobType);
      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'run'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Default jobs API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function getJobStatus() {
  const status = await getJobsService().getJobStatus();
  return NextResponse.json(status);
}

async function createDefaultJobs() {
  await getJobsService().createDefaultJobs();
  return NextResponse.json({ 
    success: true, 
    message: "Default jobs created successfully" 
  });
}

async function runJobManually(jobType: 'backup' | 'integrity_check') {
  try {
    console.log(`[Default Jobs API] Running job: ${jobType}`);
    const service = getJobsService();
    const result = await service.runJobManually(jobType);
    console.log(`[Default Jobs API] Job ${jobType} completed:`, result);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[Default Jobs API] Error running job ${jobType}:`, error);
    return NextResponse.json({
      success: false,
      message: `Failed to run ${jobType} job`,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
