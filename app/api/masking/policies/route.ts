import { NextRequest, NextResponse } from 'next/server';
import { dataMasking } from '../../../../lib/services/DataMasking';

/**
 * POST /api/masking/policies
 * Create a masking policy
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const policy = dataMasking.createPolicy(body);

    console.log(`[Data Masking] Created policy: ${policy.name}`);

    return NextResponse.json({
      success: true,
      policy,
    });

  } catch (error) {
    console.error('[Data Masking] Create policy error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to create policy',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/masking/policies
 * Get all masking policies
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const policies = dataMasking.getAllPolicies();

    return NextResponse.json({
      success: true,
      policies,
      total: policies.length,
    });

  } catch (error) {
    console.error('[Data Masking] Get policies error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get policies',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

