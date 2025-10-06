import { NextRequest, NextResponse } from 'next/server';
import { streamingConnector } from '../../../../../lib/services/StreamingConnector';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/streams/[id]/connect
 * Connect to a streaming source
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const streamId = params.id;

    console.log(`[Streams] Connecting stream: ${streamId}`);

    const success = await streamingConnector.connectStream(streamId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Stream connected successfully',
      });
    } else {
      return NextResponse.json(
        {
          error: 'Failed to connect stream',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Streams] Connect error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to connect stream',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/streams/[id]/connect
 * Disconnect from a streaming source
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  try {
    const params = await context.params;
    const streamId = params.id;

    console.log(`[Streams] Disconnecting stream: ${streamId}`);

    const success = await streamingConnector.disconnectStream(streamId);

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Stream disconnected successfully',
      });
    } else {
      return NextResponse.json(
        {
          error: 'Failed to disconnect stream',
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Streams] Disconnect error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to disconnect stream',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

