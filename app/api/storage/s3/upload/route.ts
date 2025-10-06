import { NextRequest, NextResponse } from 'next/server';
import { s3StorageService, S3Config } from '../../../../../lib/services/S3StorageService';

/**
 * POST /api/storage/s3/upload
 * Upload data to S3-compatible storage
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { config, key, data, dataType, options } = body;

    console.log(`[S3 Upload] Uploading to: ${key}`);

    if (!config || !key || !data) {
      return NextResponse.json(
        { error: 'config, key, and data are required' },
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

    let result;

    // Upload based on data type
    switch (dataType) {
      case 'json':
        result = await s3StorageService.uploadJSON(s3Config, key, data, options);
        break;
      
      case 'csv':
        result = await s3StorageService.uploadCSV(s3Config, key, data, options);
        break;
      
      case 'raw':
        result = await s3StorageService.uploadData(s3Config, key, data, options);
        break;
      
      default:
        result = await s3StorageService.uploadData(s3Config, key, JSON.stringify(data), options);
    }

    console.log(`[S3 Upload] Upload successful: ${result.location}`);

    return NextResponse.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error('[S3 Upload] Error:', error);
    
    return NextResponse.json(
      {
        error: 'S3 upload failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

