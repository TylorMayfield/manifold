import { NextRequest, NextResponse } from 'next/server';
import { FileCollectionProvider } from '../../../../lib/providers/FileCollectionProvider';
import { FileDeltaDetector } from '../../../../lib/services/FileDeltaDetector';
import { FileSnapshot } from '../../../../types/files';

// POST /api/files/index - Create a new file index/snapshot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { basePath, fileTypes, recursive, calculateChecksum, extractMetadata } = body;

    if (!basePath) {
      return NextResponse.json(
        { error: 'Base path is required' },
        { status: 400 }
      );
    }

    const provider = new FileCollectionProvider({
      type: 'file_collection',
      basePath,
      fileTypes,
      recursive,
      calculateChecksum,
      extractMetadata
    });

    // Validate the configuration
    const validation = await provider.validate();
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Execute the file scan
    const result = await provider.execute();

    // Create a snapshot
    const snapshot: FileSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      indexId: `index_${Date.now()}`,
      version: 1,
      fileCount: result.data.length,
      totalSize: result.data.reduce((sum: number, file: any) => sum + file.fileSize, 0),
      files: result.data,
      createdAt: new Date(),
      metadata: result.metadata
    };

    return NextResponse.json({
      success: true,
      snapshot,
      summary: {
        fileCount: snapshot.fileCount,
        totalSize: snapshot.totalSize,
        fileTypes: result.metadata.fileTypes
      }
    });
  } catch (error) {
    console.error('Error creating file index:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create file index' },
      { status: 500 }
    );
  }
}

