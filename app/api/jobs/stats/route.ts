import { NextResponse } from "next/server";
import { SimpleSQLiteDB } from "../../../../lib/server/database/SimpleSQLiteDB";
import { SeparatedDatabaseManager } from "../../../../lib/database/SeparatedDatabaseManager";
import fs from "fs";
import path from "path";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

let db: SimpleSQLiteDB | null = null;
let initPromise: Promise<SimpleSQLiteDB> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Jobs Stats API] Initializing database...');
    const instance = SimpleSQLiteDB.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Jobs Stats API] Database initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

export async function GET() {
  try {
    const database = await ensureDb();
    const separatedDb = SeparatedDatabaseManager.getInstance();
    
    // Get all projects to count data sources
    const projects = database.getProjects();
    let totalDataSources = 0;
    let totalStorageBytes = 0;
    
    // Count data sources and storage across all projects
    for (const project of projects) {
      try {
        const projectDataSources = await separatedDb.getDataSources(project.id);
        totalDataSources += projectDataSources.length;
        
        // Calculate storage used by checking database files
        const dataPath = path.join(process.cwd(), "data", "datasources");
        for (const ds of projectDataSources) {
          try {
            const dbPath = path.join(dataPath, project.id, `${ds.id}.db`);
            if (fs.existsSync(dbPath)) {
              const stats = fs.statSync(dbPath);
              totalStorageBytes += stats.size;
            }
          } catch (err) {
            // Skip if database doesn't exist yet
          }
        }
      } catch (err) {
        // Skip if project has no data sources
      }
    }
    
    // Format storage size
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };
    
    // Get jobs from database
    const allJobs = database.getJobs();
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
        return new Date(project.created_at) < new Date(oldest.created_at) ? project : oldest;
      });
      const uptimeMs = Date.now() - new Date(oldestProject.created_at).getTime();
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
        storageUsed: formatBytes(totalStorageBytes),
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
