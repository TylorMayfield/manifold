import { NextRequest, NextResponse } from 'next/server';
import { s3StorageService, S3Config } from '../../../../../lib/services/S3StorageService';

/**
 * POST /api/storage/s3/download
 * Download data from S3-compatible storage
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { config, key, dataType } = body;

    console.log(`[S3 Download] Downloading: ${key}`);

    if (!config || !key) {
      return NextResponse.json(
        { error: 'config and key are required' },
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

    let data;

    // Download and parse based on type
    switch (dataType) {
      case 'json':
        data = await s3StorageService.downloadJSON(s3Config, key);
        break;
      
      case 'csv':
        data = await s3StorageService.downloadCSV(s3Config, key);
        break;
      
      default:
        const result = await s3StorageService.downloadData(s3Config, key);
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of result.data) {
          chunks.push(chunk);
        }
        data = Buffer.concat(chunks).toString('utf-8');
    }

    console.log(`[S3 Download] Download successful`);

    return NextResponse.json({
      success: true,
      data,
    });

  } catch (error) {
    console.error('[S3 Download] Error:', error);
    
    return NextResponse.json(
      {
        error: 'S3 download failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

