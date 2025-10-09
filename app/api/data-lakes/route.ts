import { NextRequest, NextResponse } from 'next/server';
import { DataLakeService } from '../../../lib/services/DataLakeService';
import { clientLogger } from '../../../lib/utils/ClientLogger';

const dataLakeService = DataLakeService.getInstance();

/**
 * GET /api/data-lakes
 * Get all data lakes for a project
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';

    console.log('[Data Lakes API] Fetching data lakes for project:', projectId);

    const dataLakes = await dataLakeService.getDataLakes(projectId);

    return NextResponse.json(dataLakes);
  } catch (error) {
    console.error('[Data Lakes API] Error fetching data lakes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch data lakes',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/data-lakes
 * Create a new data lake
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId = 'default', name, description, config } = body;

    console.log('[Data Lakes API] Creating data lake:', { projectId, name });

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Data lake name is required' },
        { status: 400 }
      );
    }

    if (!config || !config.dataSourceIds || config.dataSourceIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one data source must be selected' },
        { status: 400 }
      );
    }

    // Create the data lake
    const dataLake = await dataLakeService.createDataLake({
      projectId,
      name,
      description,
      config,
    });

    console.log('[Data Lakes API] Data lake created:', dataLake.id);

    return NextResponse.json(dataLake, { status: 201 });
  } catch (error) {
    console.error('[Data Lakes API] Error creating data lake:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create data lake',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/data-lakes
 * Update an existing data lake
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Data lake ID is required' },
        { status: 400 }
      );
    }

    console.log('[Data Lakes API] Updating data lake:', id);

    const updated = await dataLakeService.updateDataLake(id, updates);

    if (!updated) {
      return NextResponse.json(
        { error: 'Data lake not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Data Lakes API] Error updating data lake:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update data lake',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data-lakes
 * Delete a data lake
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lakeId = searchParams.get('lakeId');

    if (!lakeId) {
      return NextResponse.json(
        { error: 'lakeId parameter is required' },
        { status: 400 }
      );
    }

    console.log('[Data Lakes API] Deleting data lake:', lakeId);

    const success = await dataLakeService.deleteDataLake(lakeId);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('[Data Lakes API] Error deleting data lake:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete data lake',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

