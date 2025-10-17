import { NextRequest, NextResponse } from "next/server";
import { dataDictionaryService } from "../../../../lib/services/DataDictionaryService";

/**
 * GET /api/data-dictionary/export
 * Export dictionary to JSON
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const exportData = await dataDictionaryService.exportDictionary(projectId);

    return NextResponse.json(exportData, {
      headers: {
        "Content-Disposition": `attachment; filename="data-dictionary-${projectId}-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/data-dictionary/export:", error);
    return NextResponse.json(
      { error: "Failed to export dictionary" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data-dictionary/export
 * Import dictionary from JSON
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await dataDictionaryService.importDictionary(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/data-dictionary/export:", error);
    return NextResponse.json(
      { error: "Failed to import dictionary" },
      { status: 500 }
    );
  }
}

