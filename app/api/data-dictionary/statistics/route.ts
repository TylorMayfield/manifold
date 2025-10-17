import { NextRequest, NextResponse } from "next/server";
import { dataDictionaryService } from "../../../../lib/services/DataDictionaryService";

/**
 * GET /api/data-dictionary/statistics
 * Get statistics about the data dictionary
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const statistics = await dataDictionaryService.getStatistics(
      projectId || undefined
    );

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error in GET /api/data-dictionary/statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

