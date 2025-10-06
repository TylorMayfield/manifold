import { NextRequest, NextResponse } from 'next/server';
import { s3StorageService, S3Config } from '../../../../../lib/services/S3StorageService';

/**
 * POST /api/storage/s3/test-connection
 * Test S3 connection and credentials
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { config } = body;

    console.log(`[S3 Test] Testing connection to ${config.provider || 'S3'}`);

    if (!config) {
      return NextResponse.json(
        { error: 'config is required' },
        { status: 400 }
      );
    }

    const s3Config: S3Config = {
      provider: config.provider || 's3',
      endpoint: config.endpoint,
      region: config.region,
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      bucket: config.bucket,
      forcePathStyle: config.forcePathStyle,
    };

    const result = await s3StorageService.testConnection(s3Config);

    console.log(`[S3 Test] Connection ${result.success ? 'successful' : 'failed'}`);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      bucketsAccessible: result.bucketsAccessible,
    });

  } catch (error) {
    console.error('[S3 Test] Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

