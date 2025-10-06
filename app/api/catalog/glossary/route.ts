import { NextRequest, NextResponse } from 'next/server';
import { dataCatalog, GlossaryTerm } from '../../../../lib/services/DataCatalog';

/**
 * POST /api/catalog/glossary
 * Add a term to the business glossary
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const term = dataCatalog.addGlossaryTerm(body);

    return NextResponse.json({
      success: true,
      term,
    });

  } catch (error) {
    console.error('[Catalog] Glossary add error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to add glossary term',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/catalog/glossary
 * Get all glossary terms or search
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    let terms: GlossaryTerm[];

    if (query) {
      terms = dataCatalog.searchGlossary(query);
    } else {
      terms = dataCatalog.getAllGlossaryTerms();
    }

    return NextResponse.json({
      success: true,
      terms,
      total: terms.length,
    });

  } catch (error) {
    console.error('[Catalog] Get glossary error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to get glossary terms',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

