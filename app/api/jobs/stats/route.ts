import { NextResponse } from "next/server";
import { MongoDatabase } from "../../../../lib/server/database/MongoDatabase";
import path from "path";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Jobs Stats API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Jobs Stats API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

export async function GET() {
  try {
    const database = await ensureDb();
    
    // Get all projects to count data sources
    const projects = await database.getProjects();
    
    // Get all data sources
    const allDataSources = await database.getDataSources();
    const totalDataSources = allDataSources.length;
    
    // Get jobs from database
    const allJobs = await database.getJobs();
    const totalJobs = allJobs.length;
    
    // Count completed and failed jobs today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let completedToday = 0;
    let failedToday = 0;
    
    for (const job of allJobs) {
      if (job.lastRun) {
        const jobDate = new Date(job.lastRun);
        if (jobDate >= today) {
          if (job.status === 'completed') completedToday++;
          if (job.status === 'failed') failedToday++;
        }
      }
    }
    
    const successRate = totalJobs > 0 
      ? Math.round((completedToday / (completedToday + failedToday || 1)) * 100)
      : 0;
    
    // Calculate uptime (time since first project was created)
    let uptime = "0m";
    if (projects.length > 0) {
      const oldestProject = projects.reduce((oldest: any, project: any) => {
        return new Date(project.createdAt) < new Date(oldest.createdAt) ? project : oldest;
      });
      const uptimeMs = Date.now() - new Date(oldestProject.createdAt).getTime();
      const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
      const uptimeDays = Math.floor(uptimeHours / 24);
      
      if (uptimeDays > 0) {
        uptime = `${uptimeDays}d ${uptimeHours % 24}h`;
      } else if (uptimeHours > 0) {
        uptime = `${uptimeHours}h`;
      } else {
        const uptimeMinutes = Math.floor(uptimeMs / (1000 * 60));
        uptime = `${Math.max(1, uptimeMinutes)}m`;
      }
    }
    
    const stats = {
      stats: {
        totalJobs,
        completedToday,
        failedToday,
        successRate,
      },
      systemStats: {
        dataSources: totalDataSources,
        activePipelines: 0,
        storageUsed: "N/A", // MongoDB storage not directly accessible
        uptime,
      },
      lastJob: allJobs.length > 0 ? allJobs[0] : undefined,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching job stats:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch stats",
        message: error instanceof Error ? error.message : String(error),
        stats: {
          totalJobs: 0,
          completedToday: 0,
          failedToday: 0,
          successRate: 0,
        },
        systemStats: {
          dataSources: 0,
          activePipelines: 0,
          storageUsed: "0 B",
          uptime: "0m",
        },
      },
      { status: 500 }
    );
  }
}
