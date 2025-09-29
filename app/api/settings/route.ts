import { NextRequest, NextResponse } from 'next/server'
import { SettingsService } from '../../../lib/services/SettingsService'
import { logger } from '../../../lib/utils/logger'

const settingsService = SettingsService.getInstance()

export async function GET() {
  try {
    logger.info('Fetching application settings', 'api', {}, 'settings/route.ts')
    
    // Ensure settings are loaded before getting them
    await settingsService.loadSettings()
    const settings = settingsService.getSettings()
    
    logger.success('Settings fetched successfully', 'api', {}, 'settings/route.ts')
    
    return NextResponse.json(settings)
  } catch (error: any) {
    logger.error(
      'Error fetching settings',
      'api',
      { error: error.message, stack: error.stack },
      'settings/route.ts'
    )
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updates = await request.json()
    
    logger.info('Updating application settings', 'api', { 
      keys: Object.keys(updates) 
    }, 'settings/route.ts')
    
    // Validate settings
    const validation = settingsService.validateSettings(updates)
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid settings', details: validation.errors },
        { status: 400 }
      )
    }
    
    await settingsService.updateSettings(updates)
    
    logger.success('Settings updated successfully', 'api', { 
      keys: Object.keys(updates) 
    }, 'settings/route.ts')
    
    return NextResponse.json({ 
      success: true, 
      settings: settingsService.getSettings() 
    })
  } catch (error: any) {
    logger.error(
      'Error updating settings',
      'api',
      { error: error.message, stack: error.stack },
      'settings/route.ts'
    )
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    
    logger.info('Processing settings action', 'api', { action }, 'settings/route.ts')
    
    switch (action) {
      case 'reset':
        await settingsService.resetSettings()
        return NextResponse.json({ 
          success: true, 
          settings: settingsService.getSettings(),
          message: 'Settings reset to defaults'
        })
        
      case 'export':
        const exportedSettings = await settingsService.exportSettings()
        return NextResponse.json({ 
          success: true, 
          settings: exportedSettings 
        })
        
      case 'import':
        if (!data) {
          return NextResponse.json(
            { error: 'Settings data required for import' },
            { status: 400 }
          )
        }
        await settingsService.importSettings(data)
        return NextResponse.json({ 
          success: true, 
          settings: settingsService.getSettings(),
          message: 'Settings imported successfully'
        })
        
      case 'backup':
        const backupPath = await settingsService.backupSettings()
        return NextResponse.json({ 
          success: true, 
          backupPath,
          message: 'Settings backup created'
        })
        
      case 'restore':
        if (!data?.backupPath) {
          return NextResponse.json(
            { error: 'Backup path required for restore' },
            { status: 400 }
          )
        }
        await settingsService.restoreSettings(data.backupPath)
        return NextResponse.json({ 
          success: true, 
          settings: settingsService.getSettings(),
          message: 'Settings restored from backup'
        })
        
      case 'validate':
        const validation = settingsService.validateSettings(data || {})
        return NextResponse.json({ 
          success: true, 
          validation 
        })
        
      case 'system-info':
        const systemInfo = await settingsService.getSystemInfo()
        return NextResponse.json({ 
          success: true, 
          systemInfo 
        })
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    logger.error(
      'Error processing settings action',
      'api',
      { error: error.message, stack: error.stack },
      'settings/route.ts'
    )
    return NextResponse.json(
      { error: error.message || 'Failed to process settings action' },
      { status: 500 }
    )
  }
}