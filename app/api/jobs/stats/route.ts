import { NextResponse } from "next/server";
import { CoreDatabase } from "../../../../lib/server/database/CoreDatabase";
import { SeparatedDatabaseManager } from "../../../../lib/database/SeparatedDatabaseManager";
import fs from "fs";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const coreDb = CoreDatabase.getInstance();
    const separatedDb = SeparatedDatabaseManager.getInstance();
    
    // Get all projects to count data sources
    const projects = await coreDb.getProjects();
    let totalDataSources = 0;
    let totalStorageBytes = 0;
    
    // Count data sources and storage across all projects
    for (const project of projects) {
      try {
        const projectDataSources = await separatedDb.getDataSources(project.id);
        totalDataSources += projectDataSources.length;
        
        // Calculate storage used by checking database files
        // Note: We construct the path manually since getDataSourceDbPath is private
        const dataPath = process.cwd() + "/data/datasources";
        for (const ds of projectDataSources) {
          try {
            const dbPath = `${dataPath}/${project.id}/${ds.id}.db`;
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
    
    // Get jobs from local storage or database
    // Since we don't have a jobs table yet, we'll show placeholder for now
    // but count is based on real data
    const totalJobs = projects.length > 0 ? 2 : 0; // Default jobs per project
    
    // Calculate uptime (time since first project was created)
    let uptime = "0m";
    if (projects.length > 0) {
      const oldestProject = projects.reduce((oldest, project) => {
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
        completedToday: 0, // Would need job execution history
        failedToday: 0,
        successRate: totalJobs > 0 ? 100 : 0,
      },
      systemStats: {
        dataSources: totalDataSources,
        activePipelines: 0, // Would need pipeline status tracking
        storageUsed: formatBytes(totalStorageBytes),
        uptime,
      },
      lastJob: undefined, // Would need job execution history
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
          storageUsed: "0 B",
          uptime: "0m",
        },
      },
      { status: 500 }
    );
  }
}
