import { NextRequest, NextResponse } from 'next/server';
import { streamingConnector, StreamConfig } from '../../../lib/services/StreamingConnector';

/**
 * POST /api/streams
 * Register a new streaming source
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const stream: StreamConfig = {
      id: body.id || `stream-${Date.now()}`,
      name: body.name,
      type: body.type,
      enabled: body.enabled ?? true,
      config: body.config,
      batchSize: body.batchSize || 100,
      batchTimeout: body.batchTimeout || 5000,
      maxRetries: body.maxRetries || 3,
      deadLetterQueue: body.deadLetterQueue ?? false,
      targetDataSourceId: body.targetDataSourceId,
      transformPipelineId: body.transformPipelineId,
    };

    streamingConnector.registerStream(stream);

    console.log(`[Streams] Registered stream: ${stream.name}`);

    return NextResponse.json({
      success: true,
      stream,
    });

  } catch (error) {
    console.error('[Streams] Registration error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to register stream',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/streams
 * Get all streams
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const streams = streamingConnector.getAllStreams();
    const stats = streamingConnector.getAllStats();

    // Combine streams with their statistics
    const streamsWithStats = streams.map(stream => {
      const streamStats = stats.find(s => s.streamId === stream.id);
      return {
        ...stream,
        statistics: streamStats,
      };
    });

    return NextResponse.json({
      success: true,
      streams: streamsWithStats,
      total: streams.length,
    });

  } catch (error) {
    console.error('[Streams] Get streams error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get streams',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

