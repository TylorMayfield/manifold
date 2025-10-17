import { NextRequest, NextResponse } from "next/server";
import { dataDictionaryService } from "../../../../lib/services/DataDictionaryService";
import { BulkDictionaryOperation } from "../../../../types/dataDictionary";

/**
 * POST /api/data-dictionary/bulk
 * Perform bulk operations on dictionary entries
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkDictionaryOperation = await request.json();
    
    if (!body.operation || !body.entryIds || body.entryIds.length === 0) {
      return NextResponse.json(
        { error: "operation and entryIds are required" },
        { status: 400 }
      );
    }

    const result = await dataDictionaryService.bulkOperation(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/data-dictionary/bulk:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}

