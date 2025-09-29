#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Test runner configuration
const testConfigs = {
  unit: {
    description: 'Unit tests for components and utilities',
    command: 'npm run test:unit',
    timeout: 30000,
  },
  integration: {
    description: 'Integration tests for APIs and services',
    command: 'npm run test:integration',
    timeout: 60000,
  },
  performance: {
    description: 'Performance and load tests',
    command: 'npm run test:performance',
    timeout: 120000,
  },
  accessibility: {
    description: 'Accessibility compliance tests',
    command: 'npm run test:accessibility',
    timeout: 45000,
  },
  e2e: {
    description: 'End-to-end workflow tests',
    command: 'npm run test:e2e',
    timeout: 90000,
  },
  database: {
    description: 'Database operation tests',
    command: 'npm run test:database',
    timeout: 60000,
  },
  services: {
    description: 'Service layer tests',
    command: 'npm run test:services',
    timeout: 45000,
  },
}

class TestRunner {
  constructor() {
    this.results = {}
    this.startTime = Date.now()
  }

  async runTestSuite(suiteName, config) {
    console.log(`\n🧪 Running ${suiteName} tests...`)
    console.log(`📝 ${config.description}`)
    console.log(`⏱️  Timeout: ${config.timeout / 1000}s`)
    
    const startTime = Date.now()
    
    try {
      const output = execSync(config.command, {
        encoding: 'utf8',
        timeout: config.timeout,
        stdio: 'pipe',
      })
      
      const duration = Date.now() - startTime
      this.results[suiteName] = {
        status: 'passed',
        duration,
        output,
        error: null,
      }
      
      console.log(`✅ ${suiteName} tests passed in ${(duration / 1000).toFixed(2)}s`)
      
    } catch (error) {
      const duration = Date.now() - startTime
      this.results[suiteName] = {
        status: 'failed',
        duration,
        output: error.stdout || '',
        error: error.message,
      }
      
      console.log(`❌ ${suiteName} tests failed after ${(duration / 1000).toFixed(2)}s`)
      console.log(`Error: ${error.message}`)
    }
  }

  async runAllTests(suites = Object.keys(testConfigs)) {
    console.log('🚀 Starting comprehensive test suite...')
    console.log(`📋 Running ${suites.length} test suites: ${suites.join(', ')}`)
    
    for (const suite of suites) {
      if (testConfigs[suite]) {
        await this.runTestSuite(suite, testConfigs[suite])
      } else {
        console.log(`⚠️  Unknown test suite: ${suite}`)
      }
    }
    
    this.generateSummary()
  }

  async runQuickTests() {
    console.log('⚡ Running quick test suite...')
    const quickSuites = ['unit', 'services']
    await this.runAllTests(quickSuites)
  }

  async runFullTests() {
    console.log('🔬 Running full test suite...')
    await this.runAllTests()
  }

  async runProductionTests() {
    console.log('🏭 Running production validation tests...')
    const productionSuites = ['unit', 'integration', 'database', 'services']
    await this.runAllTests(productionSuites)
  }

  generateSummary() {
    const totalDuration = Date.now() - this.startTime
    const passedSuites = Object.values(this.results).filter(r => r.status === 'passed').length
    const totalSuites = Object.keys(this.results).length
    const failedSuites = Object.values(this.results).filter(r => r.status === 'failed')
    
    console.log('\n📊 Test Suite Summary')
    console.log('=' .repeat(50))
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
    console.log(`Passed Suites: ${passedSuites}/${totalSuites}`)
    console.log(`Success Rate: ${((passedSuites / totalSuites) * 100).toFixed(1)}%`)
    
    if (failedSuites.length > 0) {
      console.log('\n❌ Failed Suites:')
      failedSuites.forEach((result, index) => {
        const suiteName = Object.keys(this.results).find(
          key => this.results[key] === result
        )
        console.log(`  ${index + 1}. ${suiteName}: ${result.error}`)
      })
    }
    
    console.log('\n📋 Suite Details:')
    Object.entries(this.results).forEach(([suite, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌'
      const duration = (result.duration / 1000).toFixed(2)
      console.log(`  ${status} ${suite}: ${duration}s`)
    })
    
    this.saveResults()
    
    if (failedSuites.length > 0) {
      console.log('\n💡 Run individual test suites for detailed output:')
      failedSuites.forEach((_, index) => {
        const suiteName = Object.keys(this.results).find(
          key => this.results[key] === failedSuites[index]
        )
        console.log(`  npm run test:${suiteName}`)
      })
      process.exit(1)
    } else {
      console.log('\n🎉 All tests passed!')
    }
  }

  saveResults() {
    const resultsPath = path.join(process.cwd(), 'test-results.json')
    const summary = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      results: this.results,
      summary: {
        totalSuites: Object.keys(this.results).length,
        passedSuites: Object.values(this.results).filter(r => r.status === 'passed').length,
        failedSuites: Object.values(this.results).filter(r => r.status === 'failed').length,
      },
    }
    
    try {
      fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2))
      console.log(`\n💾 Results saved to: ${resultsPath}`)
    } catch (error) {
      console.warn('Failed to save test results:', error)
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const runner = new TestRunner()
  
  if (args.length === 0) {
    console.log('🧪 Manifold ETL Test Runner')
    console.log('\nUsage:')
    console.log('  node scripts/test-runner.js [command]')
    console.log('\nCommands:')
    console.log('  quick       Run quick test suite (unit, services)')
    console.log('  full        Run full test suite (all tests)')
    console.log('  production  Run production validation tests')
    console.log('  [suite]     Run specific test suite')
    console.log('\nAvailable suites:')
    Object.keys(testConfigs).forEach(suite => {
      console.log(`  ${suite.padEnd(12)} ${testConfigs[suite].description}`)
    })
    process.exit(0)
  }
  
  const command = args[0]
  
  try {
    switch (command) {
      case 'quick':
        await runner.runQuickTests()
        break
      case 'full':
        await runner.runFullTests()
        break
      case 'production':
        await runner.runProductionTests()
        break
      default:
        if (testConfigs[command]) {
          await runner.runAllTests([command])
        } else {
          console.log(`❌ Unknown command: ${command}`)
          console.log('Run without arguments to see available commands.')
          process.exit(1)
        }
    }
  } catch (error) {
    console.error('Test runner failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { TestRunner, testConfigs }
