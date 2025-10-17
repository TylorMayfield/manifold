import { NextRequest, NextResponse } from "next/server";
import { dataDictionaryService } from "../../../lib/services/DataDictionaryService";
import { DataDictionaryEntry } from "../../../types/dataDictionary";

/**
 * GET /api/data-dictionary
 * List all dictionary entries or search with criteria
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const query = searchParams.get("query");
    const dataSourceId = searchParams.get("dataSourceId");

    // If dataSourceId is provided, get specific entry
    if (dataSourceId) {
      const entry = await dataDictionaryService.getEntryByDataSource(dataSourceId);
      if (!entry) {
        return NextResponse.json(
          { error: "Dictionary entry not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(entry);
    }

    // If query is provided, perform search
    if (query) {
      const tags = searchParams.get("tags")?.split(",").filter(Boolean);
      const categories = searchParams.get("categories")?.split(",").filter(Boolean);
      const domains = searchParams.get("domains")?.split(",").filter(Boolean);
      const owner = searchParams.get("owner");
      const hasRelationships = searchParams.get("hasRelationships");
      const qualityScoreMin = searchParams.get("qualityScoreMin");
      const qualityScoreMax = searchParams.get("qualityScoreMax");

      const results = await dataDictionaryService.search({
        query,
        tags,
        categories,
        domains,
        owner: owner || undefined,
        hasRelationships: hasRelationships ? hasRelationships === "true" : undefined,
        qualityScoreMin: qualityScoreMin ? parseInt(qualityScoreMin) : undefined,
        qualityScoreMax: qualityScoreMax ? parseInt(qualityScoreMax) : undefined,
      });

      return NextResponse.json(results);
    }

    // Otherwise, list all entries
    const entries = await dataDictionaryService.listEntries(projectId || undefined);
    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error in GET /api/data-dictionary:", error);
    return NextResponse.json(
      { error: "Failed to fetch dictionary entries" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data-dictionary
 * Create a new dictionary entry
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = await dataDictionaryService.createEntry(body);
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/data-dictionary:", error);
    return NextResponse.json(
      { error: "Failed to create dictionary entry" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/data-dictionary
 * Update an existing dictionary entry
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const updatedEntry = await dataDictionaryService.updateEntry(id, updates);
    
    if (!updatedEntry) {
      return NextResponse.json(
        { error: "Dictionary entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error in PUT /api/data-dictionary:", error);
    return NextResponse.json(
      { error: "Failed to update dictionary entry" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data-dictionary
 * Delete a dictionary entry
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Entry ID is required" },
        { status: 400 }
      );
    }

    const deleted = await dataDictionaryService.deleteEntry(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Dictionary entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/data-dictionary:", error);
    return NextResponse.json(
      { error: "Failed to delete dictionary entry" },
      { status: 500 }
    );
  }
}

