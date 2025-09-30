import { NextResponse } from "next/server";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // In a real implementation, this would fetch from the database
    // For now, return mock data that updates
    
    const now = new Date();
    const stats = {
      stats: {
        totalJobs: 12,
        completedToday: Math.floor(Math.random() * 10) + 5,
        failedToday: Math.floor(Math.random() * 3),
        successRate: 95 + Math.floor(Math.random() * 5),
      },
      systemStats: {
        dataSources: 8,
        activePipelines: 3,
        storageUsed: "1.2 GB",
        uptime: "5d 12h",
      },
      lastJob: Math.random() > 0.3 ? {
        id: "job_" + Date.now(),
        name: "Daily Data Sync",
        status: Math.random() > 0.8 ? "failed" as const : "completed" as const,
        endTime: new Date(Date.now() - Math.random() * 3600000),
        duration: Math.random() * 60000 + 5000,
      } : undefined,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch stats",
        stats: {
          totalJobs: 0,
          completedToday: 0,
          failedToday: 0,
          successRate: 0,
        },
        systemStats: {
          dataSources: 0,
          activePipelines: 0,
        },
      },
      { status: 500 }
    );
  }
}
