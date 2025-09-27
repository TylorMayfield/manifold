import { NextRequest, NextResponse } from "next/server";

// Dynamic import to avoid server-side code during build
async function getDbManager() {
  const { DatabaseManager } = await import(
    "../../../lib/server/database/DatabaseManager"
  );
  const dbManager = DatabaseManager.getInstance();
  await dbManager.initialize();
  return dbManager;
}

// Ensure default project exists
async function ensureDefaultProject() {
  const db = await getDbManager();

  try {
    // Check if default project exists
    const existingProject = await db.getProject("default");
    if (existingProject) {
      return existingProject;
    }
  } catch (error) {
    // Project doesn't exist, create it
  }

  // Create default project
  const defaultProject = await db.createProject({
    name: "Default Project",
    description: "Default ETL workspace",
  });

  return defaultProject;
}

export async function GET(request: NextRequest) {
  try {
    const db = await getDbManager();
    const projects = await db.getProjects();

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const db = await getDbManager();
    const project = await db.createProject(body);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// Initialize default project on first API call
export async function PATCH() {
  try {
    const project = await ensureDefaultProject();
    return NextResponse.json(project);
  } catch (error) {
    console.error("Error initializing default project:", error);
    return NextResponse.json(
      { error: "Failed to initialize default project" },
      { status: 500 }
    );
  }
}
