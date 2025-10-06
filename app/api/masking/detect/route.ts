import { NextRequest, NextResponse } from 'next/server';
import { dataMasking } from '../../../../lib/services/DataMasking';

/**
 * POST /api/masking/detect
 * Detect PII in a dataset
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const { data, options } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format - expected array' },
        { status: 400 }
      );
    }

    console.log(`[Data Masking] Detecting PII in ${data.length} records`);

    const results = await dataMasking.detectPII(data, options);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalFields: data.length > 0 ? Object.keys(data[0]).length : 0,
        piiFieldsFound: results.length,
        totalAffectedRecords: results.reduce((sum, r) => sum + r.affectedRecords, 0),
      },
    });

  } catch (error) {
    console.error('[Data Masking] PII detection error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to detect PII',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

