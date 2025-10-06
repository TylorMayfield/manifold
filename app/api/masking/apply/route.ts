import { NextRequest, NextResponse } from 'next/server';
import { dataMasking, MaskingRule } from '../../../../lib/services/DataMasking';

/**
 * POST /api/masking/apply
 * Apply masking rules to data
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const { data, rules, policyId } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format - expected array' },
        { status: 400 }
      );
    }

    console.log(`[Data Masking] Applying masking to ${data.length} records`);

    let maskedData: any[];
    let result: any;

    if (policyId) {
      // Apply policy
      const response = await dataMasking.applyPolicy(policyId, data);
      maskedData = response.maskedData;
      result = response.result;
    } else if (rules && Array.isArray(rules)) {
      // Apply rules directly
      const response = await dataMasking.applyMasking(data, rules as MaskingRule[]);
      maskedData = response.maskedData;
      result = response.result;
    } else {
      return NextResponse.json(
        { error: 'Either rules or policyId must be provided' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      maskedData,
      result,
    });

  } catch (error) {
    console.error('[Data Masking] Apply masking error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to apply masking',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

