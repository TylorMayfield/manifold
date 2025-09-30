import { NextRequest, NextResponse } from "next/server";
import { DefaultJobsService } from "../../../../lib/services/DefaultJobsService";

// Force dynamic rendering to avoid build-time database initialization
export const dynamic = 'force-dynamic';

let defaultJobsService: DefaultJobsService | null = null;

function getJobsService() {
  if (!defaultJobsService) {
    defaultJobsService = new DefaultJobsService();
  }
  return defaultJobsService;
}

export async function GET(request: NextRequest) {
  try {
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
  const result = await getJobsService().runJobManually(jobType);
  return NextResponse.json(result);
}
