import { NextResponse } from 'next/server'
import { DataLakeService } from '../../../../../../lib/services/DataLakeService'
import { logger } from '../../../../../../lib/utils/logger'

const dataLakeService = DataLakeService.getInstance()

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { sql, parameters } = body

    if (!sql) {
      return NextResponse.json(
        { error: 'SQL query is required' },
        { status: 400 }
      )
    }

    logger.info('Executing data lake query', 'api', { dataLakeId: id }, 'data-lakes/[id]/query/route.ts')

    const query = {
      id: `query_${Date.now()}`,
      dataLakeId: id,
      name: 'Ad-hoc Query',
      sql,
      parameters: parameters || {},
      isPublic: false,
      createdAt: new Date(),
      executionCount: 1,
    }

    const result = await dataLakeService.executeQuery(id, query)

    logger.success(`Data lake query executed: ${id}`, 'api', { 
      dataLakeId: id, 
      queryId: query.id,
      duration: result.duration,
      status: result.status,
      rowsReturned: result.returnedRows 
    }, 'data-lakes/[id]/query/route.ts')

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error(
      'Error executing data lake query',
      'api',
      { error: error.message, stack: error.stack },
      'data-lakes/[id]/query/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    )
  }
}
