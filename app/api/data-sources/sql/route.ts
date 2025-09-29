import { NextRequest, NextResponse } from 'next/server'
import { SQLDataSourceService } from '../../../lib/services/SQLDataSourceService'
import { logger } from '../../../lib/utils/logger'
import { SeparatedDatabaseManager } from '../../../lib/server/database/SeparatedDatabaseManager'

const sqlService = SQLDataSourceService.getInstance()
const dbManager = SeparatedDatabaseManager.getInstance()

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    
    logger.info('SQL data source operation', 'api', { action }, 'sql/route.ts')
    
    switch (action) {
      case 'parse-file':
        if (!data?.filePath) {
          return NextResponse.json(
            { error: 'File path required for parsing' },
            { status: 400 }
          )
        }
        
        const parseResult = await sqlService.parseSQLFile(data.filePath, data.config)
        return NextResponse.json({
          success: true,
          result: parseResult
        })
        
      case 'parse-content':
        if (!data?.content) {
          return NextResponse.json(
            { error: 'SQL content required for parsing' },
            { status: 400 }
          )
        }
        
        const parseContentResult = await sqlService.parseSQLContent(data.content, data.config)
        return NextResponse.json({
          success: true,
          result: parseContentResult
        })
        
      case 'analyze-file':
        if (!data?.filePath) {
          return NextResponse.json(
            { error: 'File path required for analysis' },
            { status: 400 }
          )
        }
        
        const analysisResult = await sqlService.analyzeSQLFile(data.filePath, data.config)
        return NextResponse.json({
          success: true,
          result: analysisResult
        })
        
      case 'execute':
        if (!data?.dataSourceId || !data?.statements) {
          return NextResponse.json(
            { error: 'Data source ID and statements required for execution' },
            { status: 400 }
          )
        }
        
        // Get data source database path
        const dataSource = await dbManager.getDataSource(data.dataSourceId)
        if (!dataSource) {
          return NextResponse.json(
            { error: 'Data source not found' },
            { status: 404 }
          )
        }
        
        const executeResult = await sqlService.executeSQL(
          data.statements,
          dataSource.dataPath,
          data.config,
          (progress) => {
            // Send progress updates via WebSocket or Server-Sent Events
            // For now, we'll just log it
            logger.info('SQL execution progress', 'api', progress, 'sql/route.ts')
          }
        )
        
        return NextResponse.json({
          success: true,
          result: executeResult
        })
        
      case 'validate':
        if (!data?.content && !data?.filePath) {
          return NextResponse.json(
            { error: 'Content or file path required for validation' },
            { status: 400 }
          )
        }
        
        try {
          let parseResult
          if (data.filePath) {
            parseResult = await sqlService.parseSQLFile(data.filePath, data.config)
          } else {
            parseResult = await sqlService.parseSQLContent(data.content, data.config)
          }
          
          return NextResponse.json({
            success: true,
            valid: parseResult.errors.length === 0,
            errors: parseResult.errors,
            warnings: parseResult.warnings,
            statementCount: parseResult.statements.length,
            tableCount: parseResult.tables.length
          })
        } catch (error: any) {
          return NextResponse.json({
            success: true,
            valid: false,
            errors: [error.message],
            warnings: [],
            statementCount: 0,
            tableCount: 0
          })
        }
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    logger.error(
      'SQL data source operation failed',
      'api',
      { error: error.message, stack: error.stack },
      'sql/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'SQL operation failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const dataSourceId = searchParams.get('dataSourceId')
    
    logger.info('SQL data source GET operation', 'api', { action, dataSourceId }, 'sql/route.ts')
    
    switch (action) {
      case 'preview':
        if (!dataSourceId) {
          return NextResponse.json(
            { error: 'Data source ID required for preview' },
            { status: 400 }
          )
        }
        
        // Get data source info
        const dataSource = await dbManager.getDataSource(dataSourceId)
        if (!dataSource) {
          return NextResponse.json(
            { error: 'Data source not found' },
            { status: 404 }
          )
        }
        
        // Return basic info about the data source
        return NextResponse.json({
          success: true,
          dataSource: {
            id: dataSource.id,
            name: dataSource.name,
            type: dataSource.type,
            status: dataSource.status,
            lastSyncAt: dataSource.lastSyncAt
          }
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    logger.error(
      'SQL data source GET operation failed',
      'api',
      { error: error.message, stack: error.stack },
      'sql/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'SQL operation failed' },
      { status: 500 }
    )
  }
}
