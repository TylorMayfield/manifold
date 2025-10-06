import { NextRequest, NextResponse } from 'next/server';
import { s3StorageService, S3Config } from '../../../../../lib/services/S3StorageService';

/**
 * POST /api/storage/s3/list
 * List objects in S3 bucket
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { config, prefix, maxKeys, continuationToken } = body;

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

    const result = await s3StorageService.listObjects(s3Config, {
      prefix,
      maxKeys,
      continuationToken,
    });

    console.log(`[S3 List] Found ${result.objects.length} objects`);

    return NextResponse.json({
      success: true,
      objects: result.objects,
      hasMore: result.hasMore,
      continuationToken: result.continuationToken,
    });

  } catch (error) {
    console.error('[S3 List] Error:', error);
    
    return NextResponse.json(
      {
        error: 'S3 list failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

