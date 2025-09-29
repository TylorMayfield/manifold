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

    logger.info('Starting data lake build', 'api', { dataLakeId: id }, 'data-lakes/[id]/build/route.ts')

    const buildResult = await dataLakeService.buildDataLake(id)

    logger.success(`Data lake build completed: ${id}`, 'api', { 
      dataLakeId: id, 
      buildId: buildResult.id,
      status: buildResult.status,
      duration: buildResult.duration,
      recordsProcessed: buildResult.recordsProcessed 
    }, 'data-lakes/[id]/build/route.ts')

    return NextResponse.json(buildResult)
  } catch (error: any) {
    logger.error(
      'Error building data lake',
      'api',
      { error: error.message, stack: error.stack },
      'data-lakes/[id]/build/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'Failed to build data lake' },
      { status: 500 }
    )
  }
}
