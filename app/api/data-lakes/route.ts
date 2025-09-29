import { NextResponse } from 'next/server'
import { DataLakeService } from '../../../../lib/services/DataLakeService'
import { logger } from '../../../../lib/utils/logger'

const dataLakeService = DataLakeService.getInstance()

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    logger.info('Fetching data lakes for project', 'api', { projectId }, 'data-lakes/route.ts')

    const dataLakes = await dataLakeService.getDataLakesForProject(projectId)

    logger.success(`Retrieved ${dataLakes.length} data lakes for project`, 'api', { projectId }, 'data-lakes/route.ts')

    return NextResponse.json(dataLakes)
  } catch (error: any) {
    logger.error(
      'Error fetching data lakes',
      'api',
      { error: error.message, stack: error.stack },
      'data-lakes/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data lakes' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId, name, description, config } = body

    if (!projectId || !name || !config) {
      return NextResponse.json(
        { error: 'Project ID, name, and config are required' },
        { status: 400 }
      )
    }

    logger.info('Creating new data lake', 'api', { projectId, name }, 'data-lakes/route.ts')

    const dataLake = await dataLakeService.createDataLake(projectId, {
      name,
      description,
      config,
    })

    logger.success(`Data lake created: ${dataLake.name}`, 'api', { dataLakeId: dataLake.id }, 'data-lakes/route.ts')

    return NextResponse.json(dataLake, { status: 201 })
  } catch (error: any) {
    logger.error(
      'Error creating data lake',
      'api',
      { error: error.message, stack: error.stack },
      'data-lakes/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'Failed to create data lake' },
      { status: 500 }
    )
  }
}
