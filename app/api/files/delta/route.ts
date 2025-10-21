import { NextRequest, NextResponse } from 'next/server';
import { FileDeltaDetector } from '../../../../lib/services/FileDeltaDetector';
import { FileSnapshot, FileDelta } from '../../../../types/files';

// POST /api/files/delta - Calculate delta between two file snapshots
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { previousSnapshot, currentSnapshot, fileTypes } = body;

    if (!currentSnapshot) {
      return NextResponse.json(
        { error: 'Current snapshot is required' },
        { status: 400 }
      );
    }

    // Detect delta
    let delta: FileDelta = FileDeltaDetector.detectDelta(
      previousSnapshot || null,
      currentSnapshot
    );

    // Filter by file types if specified
    if (fileTypes && fileTypes.length > 0) {
      delta = FileDeltaDetector.filterDeltaByFileType(delta, fileTypes);
    }

    // Generate report
    const report = FileDeltaDetector.generateDeltaReport(delta);

    return NextResponse.json({
      success: true,
      delta,
      report,
      summary: {
        totalChanges: delta.addedCount + delta.removedCount + delta.modifiedCount,
        added: delta.addedCount,
        removed: delta.removedCount,
        modified: delta.modifiedCount,
        unchanged: delta.unchangedCount
      }
    });
  } catch (error) {
    console.error('Error calculating file delta:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate delta' },
      { status: 500 }
    );
  }
}

