import { NextRequest, NextResponse } from "next/server";
import { MongoDatabase } from "../../../lib/server/database/MongoDatabase";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

let db: MongoDatabase | null = null;
let initPromise: Promise<MongoDatabase> | null = null;

async function ensureDb() {
  if (db) return db;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    console.log('[Projects API] Initializing MongoDB...');
    const instance = MongoDatabase.getInstance();
    await instance.initialize();
    db = instance;
    console.log('[Projects API] MongoDB initialized successfully');
    return instance;
  })();
  
  return initPromise;
}

// Ensure default project exists
async function ensureDefaultProject() {
  const database = await ensureDb();

  try {
    // Check if default project exists
    const existingProject = await database.getProject("default");
    if (existingProject) {
      console.log('[Projects API] Default project already exists');
      return existingProject;
    }
  } catch (error) {
    // Project doesn't exist, create it
    console.log('[Projects API] Default project not found, creating...');
  }

  // Create default project
  try {
    const defaultProject = await database.createProject({
      id: "default",
      name: "Default Project",
      description: "Default ETL workspace",
      dataPath: "./data/projects/default",
    });

    console.log('[Projects API] Default project created successfully:', defaultProject);
    return defaultProject;
  } catch (createError) {
    console.error('[Projects API] Error creating default project:', createError);
    throw createError;
  }
}

export async function GET(request: NextRequest) {
  try {
    const database = await ensureDb();
    const projects = await database.getProjects();

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const database = await ensureDb();
    const project = await database.createProject(body);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Project id is required' },
        { status: 400 }
      );
    }

    const database = await ensureDb();
    const project = await database.updateProject(id, updates);

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const database = await ensureDb();
    await database.deleteProject(projectId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

// Initialize default project on first API call
export async function PATCH() {
  try {
    console.log('[Projects API] PATCH - Ensuring default project...');
    const project = await ensureDefaultProject();
    console.log('[Projects API] PATCH - Default project ready:', project);
    return NextResponse.json(project);
  } catch (error) {
    console.error("[Projects API] Error initializing default project:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[Projects API] Error details:", { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        error: "Failed to initialize default project",
        message: errorMessage,
        details: errorStack 
      },
      { status: 500 }
    );
  }
}
