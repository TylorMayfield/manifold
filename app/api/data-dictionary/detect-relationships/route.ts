import { NextRequest, NextResponse } from "next/server";
import { dataDictionaryService } from "../../../../lib/services/DataDictionaryService";
import { relationshipDetectionService } from "../../../../lib/services/RelationshipDetectionService";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/data-dictionary/detect-relationships
 * Detect relationships for one or all dictionary entries
 * 
 * Body:
 * - entryId?: string (optional - if provided, detect for single entry)
 * - projectId: string
 * - options?: DetectionOptions
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entryId, projectId, options = {} } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Get all entries for the project
    const entries = await dataDictionaryService.listEntries(projectId);

    if (entries.length < 2) {
      return NextResponse.json({
        suggestions: [],
        message: "Need at least 2 dictionary entries to detect relationships",
      });
    }

    let suggestions;

    if (entryId) {
      // Detect for single entry
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) {
        return NextResponse.json(
          { error: "Entry not found" },
          { status: 404 }
        );
      }

      const entrySuggestions = await relationshipDetectionService.detectRelationshipsForEntry(
        entry,
        entries,
        options
      );

      suggestions = {
        [entryId]: entrySuggestions,
      };
    } else {
      // Detect for all entries
      const allSuggestions = await relationshipDetectionService.detectAllRelationships(
        entries,
        options
      );

      // Convert Map to object for JSON response
      suggestions = Object.fromEntries(allSuggestions);
    }

    // Calculate summary statistics
    const totalSuggestions = Object.values(suggestions).flat().length;
    const highConfidence = Object.values(suggestions)
      .flat()
      .filter((s: any) => s.confidence >= 80).length;
    const mediumConfidence = Object.values(suggestions)
      .flat()
      .filter((s: any) => s.confidence >= 60 && s.confidence < 80).length;

    return NextResponse.json({
      suggestions,
      summary: {
        totalSuggestions,
        highConfidence,
        mediumConfidence,
        lowConfidence: totalSuggestions - highConfidence - mediumConfidence,
        entriesAnalyzed: entryId ? 1 : entries.length,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/data-dictionary/detect-relationships:", error);
    return NextResponse.json(
      {
        error: "Failed to detect relationships",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/data-dictionary/detect-relationships
 * Accept relationship suggestions and create actual relationships
 * 
 * Body:
 * - suggestionIds: string[]
 * - projectId: string
 * - entryId: string (the entry to add relationships to)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { suggestionIds, projectId, entryId } = body;

    if (!projectId || !entryId || !suggestionIds || !Array.isArray(suggestionIds)) {
      return NextResponse.json(
        { error: "projectId, entryId, and suggestionIds array are required" },
        { status: 400 }
      );
    }

    // Get all entries
    const entries = await dataDictionaryService.listEntries(projectId);
    
    // Get the entry to update
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) {
      return NextResponse.json(
        { error: "Entry not found" },
        { status: 404 }
      );
    }

    // Detect relationships for this entry to get the suggestions
    const suggestions = await relationshipDetectionService.detectRelationshipsForEntry(
      entry,
      entries
    );

    // Filter to only the selected suggestions
    const selectedSuggestions = suggestions.filter((s) =>
      suggestionIds.includes(s.id)
    );

    if (selectedSuggestions.length === 0) {
      return NextResponse.json(
        { error: "No valid suggestions found with provided IDs" },
        { status: 404 }
      );
    }

    // Accept the suggestions and create relationships
    const newRelationships = await relationshipDetectionService.acceptMultipleSuggestions(
      selectedSuggestions,
      entries
    );

    // Update the entry with new relationships
    const updatedRelationships = [...entry.relationships, ...newRelationships];
    await dataDictionaryService.updateEntry(entryId, {
      relationships: updatedRelationships,
    });

    return NextResponse.json({
      success: true,
      addedRelationships: newRelationships.length,
      relationships: newRelationships,
    });
  } catch (error) {
    console.error("Error in PUT /api/data-dictionary/detect-relationships:", error);
    return NextResponse.json(
      {
        error: "Failed to accept relationship suggestions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

