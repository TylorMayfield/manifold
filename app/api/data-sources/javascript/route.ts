import { NextRequest, NextResponse } from "next/server";
import { SeparatedDatabaseManager } from "../../../../lib/server/database/SeparatedDatabaseManager";
import { JavaScriptDataSourceService } from "../../../../lib/services/JavaScriptDataSourceService";

const dbManager = SeparatedDatabaseManager.getInstance();
const jsService = new JavaScriptDataSourceService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, dataSourceId, ...params } = body;

    switch (action) {
      case "execute":
        return await executeScript(projectId, dataSourceId, params);
      case "import":
        return await importData(projectId, dataSourceId, params);
      case "test":
        return await testScript(params);
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("JavaScript data source API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function executeScript(projectId: string, dataSourceId: string, params: {
  script: string;
  variables?: Record<string, any>;
}) {
  const result = await jsService.executeJavaScriptScript(
    projectId,
    dataSourceId,
    params.script,
    params.variables || {}
  );

  return NextResponse.json(result);
}

async function importData(projectId: string, dataSourceId: string, params: {
  script: string;
  variables?: Record<string, any>;
  schema?: any;
  enableDiff?: boolean;
  diffKey?: string;
}) {
  const result = await jsService.importJavaScriptData(
    projectId,
    dataSourceId,
    params.script,
    params.variables || {},
    {
      schema: params.schema,
      enableDiff: params.enableDiff,
      diffKey: params.diffKey
    }
  );

  return NextResponse.json(result);
}

async function testScript(params: {
  script: string;
  variables?: Record<string, any>;
}) {
  const result = await jsService.testScript(
    params.script,
    params.variables || {}
  );

  return NextResponse.json(result);
}
