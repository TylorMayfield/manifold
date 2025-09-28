import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  BaseProvider,
  ProviderConfig,
  ExecutionContext,
  ExecutionResult,
  ValidationResult,
  ValidationError,
  TestConnectionResult,
  ColumnInfo,
  ProgressInfo
} from './BaseProvider';

export interface ScriptProviderConfig extends ProviderConfig {
  type: 'script';
  connection: {
    scriptType: 'javascript' | 'python' | 'shell';
    scriptPath?: string;
    scriptContent: string;
    workingDirectory?: string;
    timeout?: number; // in milliseconds
  };
  options: {
    // For JavaScript
    nodeVersion?: string;
    nodeModulePaths?: string[];
    
    // For Python
    pythonExecutable?: string;
    pythonPath?: string[];
    requirements?: string[]; // pip packages
    virtualEnv?: string;
    
    // For Shell
    shell?: string; // bash, zsh, sh, etc.
    
    // Common options
    environment?: Record<string, string>;
    arguments?: string[];
    enableOutput?: boolean;
    outputFormat?: 'json' | 'csv' | 'raw';
    expectedColumns?: ColumnInfo[];
    maxOutputSize?: number; // in bytes
    allowFileSystemAccess?: boolean;
    allowNetworkAccess?: boolean;
  };
}

export class ScriptProvider extends BaseProvider {
  private config: ScriptProviderConfig;

  constructor(config: ProviderConfig) {
    super(config);
    this.config = config as ScriptProviderConfig;
  }

  get type(): string {
    return 'script';
  }

  get displayName(): string {
    return 'Custom Scripts';
  }

  get description(): string {
    return 'Execute custom JavaScript, Python, or shell scripts for data processing';
  }

  async validateConfig(config?: Partial<ScriptProviderConfig>): Promise<ValidationResult> {
    const configToValidate = config ? { ...this.config, ...config } : this.config;
    const errors: ValidationError[] = [];

    // Validate script type
    if (!configToValidate.connection.scriptType) {
      errors.push({
        field: 'connection.scriptType',
        code: 'MISSING_SCRIPT_TYPE',
        message: 'Script type is required (javascript, python, or shell)'
      });
    } else if (!['javascript', 'python', 'shell'].includes(configToValidate.connection.scriptType)) {
      errors.push({
        field: 'connection.scriptType',
        code: 'INVALID_SCRIPT_TYPE',
        message: 'Script type must be javascript, python, or shell'
      });
    }

    // Validate script content or path
    if (!configToValidate.connection.scriptContent && !configToValidate.connection.scriptPath) {
      errors.push({
        field: 'connection',
        code: 'MISSING_SCRIPT',
        message: 'Either script content or script path is required'
      });
    }

    // Validate script path if provided
    if (configToValidate.connection.scriptPath) {
      try {
        if (!fs.existsSync(configToValidate.connection.scriptPath)) {
          errors.push({
            field: 'connection.scriptPath',
            code: 'SCRIPT_FILE_NOT_FOUND',
            message: 'Script file not found at specified path'
          });
        }
      } catch (err) {
        errors.push({
          field: 'connection.scriptPath',
          code: 'SCRIPT_ACCESS_ERROR',
          message: 'Unable to access script file'
        });
      }
    }

    // Validate working directory if provided
    if (configToValidate.connection.workingDirectory) {
      try {
        if (!fs.existsSync(configToValidate.connection.workingDirectory)) {
          errors.push({
            field: 'connection.workingDirectory',
            code: 'WORKING_DIR_NOT_FOUND',
            message: 'Working directory not found'
          });
        }
      } catch (err) {
        errors.push({
          field: 'connection.workingDirectory',
          code: 'WORKING_DIR_ACCESS_ERROR',
          message: 'Unable to access working directory'
        });
      }
    }

    // Validate timeout
    if (configToValidate.connection.timeout && configToValidate.connection.timeout <= 0) {
      errors.push({
        field: 'connection.timeout',
        code: 'INVALID_TIMEOUT',
        message: 'Timeout must be a positive number'
      });
    }

    // Validate Python executable if Python script
    if (configToValidate.connection.scriptType === 'python') {
      const pythonExecutable = configToValidate.options.pythonExecutable || 'python3';
      try {
        execSync(`${pythonExecutable} --version`, { stdio: 'pipe' });
      } catch (err) {
        errors.push({
          field: 'options.pythonExecutable',
          code: 'PYTHON_NOT_FOUND',
          message: `Python executable not found: ${pythonExecutable}`
        });
      }
    }

    // Validate Node.js for JavaScript scripts
    if (configToValidate.connection.scriptType === 'javascript') {
      try {
        execSync('node --version', { stdio: 'pipe' });
      } catch (err) {
        errors.push({
          field: 'connection.scriptType',
          code: 'NODE_NOT_FOUND',
          message: 'Node.js not found in system PATH'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async testConnection(): Promise<TestConnectionResult> {
    const startTime = Date.now();

    try {
      // Create a simple test script based on type
      const testScript = this.createTestScript();
      const result = await this.executeScript(testScript, true);

      const latency = Date.now() - startTime;

      if (result.success) {
        return {
          success: true,
          message: `${this.config.connection.scriptType} script executed successfully`,
          latency
        };
      } else {
        return {
          success: false,
          error: result.error || 'Script execution failed',
          latency
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        latency: Date.now() - startTime
      };
    }
  }

  async run(ctx: ExecutionContext): Promise<ExecutionResult> {
    this.isRunning = true;
    this.currentContext = ctx;
    const startTime = Date.now();

    try {
      this.emitLog('info', `Starting ${this.config.connection.scriptType} script execution`);
      
      // Get script content
      const scriptContent = await this.getScriptContent();
      
      // Execute script
      const executionResult = await this.executeScript(scriptContent);
      
      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), executionResult.success);

      if (executionResult.success) {
        this.emitLog('info', `Script execution completed: ${executionResult.recordsProcessed || 0} records processed in ${this.formatDuration(duration)}`);

        return {
          success: true,
          recordsProcessed: executionResult.recordsProcessed || 0,
          bytesProcessed: executionResult.bytesProcessed || 0,
          duration,
          metadata: {
            scriptType: this.config.connection.scriptType,
            output: executionResult.output,
            exitCode: executionResult.exitCode,
            columns: executionResult.columns
          }
        };
      } else {
        throw new Error(executionResult.error || 'Script execution failed');
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateScheduleMetadata(new Date(), false);
      
      this.emitLog('error', 'Script execution failed', error);
      
      return this.createExecutionError(
        'SCRIPT_EXECUTION_FAILED',
        error instanceof Error ? error.message : String(error),
        error
      );
    } finally {
      this.isRunning = false;
      this.currentContext = undefined;
    }
  }

  async previewData(options: { limit?: number } = {}): Promise<any[]> {
    try {
      // For preview, we'll execute the script and try to parse the output
      const scriptContent = await this.getScriptContent();
      const result = await this.executeScript(scriptContent, true);
      
      if (result.success && result.output) {
        const parsedData = this.parseScriptOutput(result.output);
        return parsedData.slice(0, options.limit || 10);
      }
      
      return [];
    } catch (error) {
      throw error;
    }
  }

  private createTestScript(): string {
    switch (this.config.connection.scriptType) {
      case 'javascript':
        return `
console.log(JSON.stringify({
  status: 'success',
  timestamp: new Date().toISOString(),
  nodeVersion: process.version
}));
        `.trim();

      case 'python':
        return `
import json
import sys
from datetime import datetime

print(json.dumps({
    'status': 'success',
    'timestamp': datetime.now().isoformat(),
    'pythonVersion': sys.version
}))
        `.trim();

      case 'shell':
        return `
echo '{"status": "success", "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'", "shell": "'$0'"}'
        `.trim();

      default:
        throw new Error(`Unsupported script type: ${this.config.connection.scriptType}`);
    }
  }

  private async getScriptContent(): Promise<string> {
    if (this.config.connection.scriptPath) {
      return fs.readFileSync(this.config.connection.scriptPath, 'utf8');
    }
    return this.config.connection.scriptContent;
  }

  private async executeScript(scriptContent: string, isTest = false): Promise<{
    success: boolean;
    output?: string;
    error?: string;
    exitCode?: number;
    recordsProcessed?: number;
    bytesProcessed?: number;
    columns?: string[];
  }> {
    return new Promise((resolve) => {
      let command: string;
      let args: string[] = [];
      let scriptFile: string | undefined;

      try {
        // Prepare execution based on script type
        switch (this.config.connection.scriptType) {
          case 'javascript':
            command = 'node';
            // Create temporary file for Node.js execution
            scriptFile = path.join(process.cwd(), `.temp-script-${Date.now()}.js`);
            fs.writeFileSync(scriptFile, scriptContent);
            args = [scriptFile];
            break;

          case 'python':
            command = this.config.options.pythonExecutable || 'python3';
            // Create temporary file for Python execution
            scriptFile = path.join(process.cwd(), `.temp-script-${Date.now()}.py`);
            fs.writeFileSync(scriptFile, scriptContent);
            args = [scriptFile];
            break;

          case 'shell':
            command = this.config.options.shell || 'bash';
            args = ['-c', scriptContent];
            break;

          default:
            resolve({
              success: false,
              error: `Unsupported script type: ${this.config.connection.scriptType}`
            });
            return;
        }

        // Add custom arguments if specified
        if (this.config.options.arguments) {
          args.push(...this.config.options.arguments);
        }

        // Set up environment
        const env = {
          ...process.env,
          ...this.config.options.environment
        };

        // Set working directory
        const cwd = this.config.connection.workingDirectory || process.cwd();

        let output = '';
        let errorOutput = '';
        let recordsProcessed = 0;
        let bytesProcessed = 0;

        // Execute script
        const childProcess = spawn(command, args, {
          env,
          cwd,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Collect stdout
        childProcess.stdout?.on('data', (data) => {
          const chunk = data.toString();
          output += chunk;
          bytesProcessed += chunk.length;

          // Emit progress if not a test
          if (!isTest) {
            // Try to count records if output looks like JSON lines
            const lines = chunk.split('\n').filter(line => line.trim());
            recordsProcessed += lines.length;

            this.emitProgress({
              percent: Math.min(50, (bytesProcessed / 1024) * 10), // Rough estimate
              recordsProcessed,
              currentStep: `Processing script output... (${recordsProcessed} records)`,
              bytesProcessed
            });
          }
        });

        // Collect stderr
        childProcess.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });

        // Handle completion
        childProcess.on('close', (code) => {
          // Clean up temporary file
          if (scriptFile && fs.existsSync(scriptFile)) {
            try {
              fs.unlinkSync(scriptFile);
            } catch (err) {
              // Ignore cleanup errors
            }
          }

          if (code === 0) {
            // Parse output to get columns
            const parsedData = this.parseScriptOutput(output);
            const columns = parsedData.length > 0 ? Object.keys(parsedData[0]) : [];

            resolve({
              success: true,
              output,
              exitCode: code,
              recordsProcessed: parsedData.length,
              bytesProcessed,
              columns
            });
          } else {
            resolve({
              success: false,
              error: errorOutput || `Script exited with code ${code}`,
              exitCode: code,
              output: errorOutput
            });
          }
        });

        // Handle timeout
        const timeout = this.config.connection.timeout || 30000; // 30 seconds default
        const timeoutId = setTimeout(() => {
          childProcess.kill('SIGTERM');
          resolve({
            success: false,
            error: `Script execution timeout after ${timeout}ms`
          });
        }, timeout);

        childProcess.on('close', () => {
          clearTimeout(timeoutId);
        });

        // Handle errors
        childProcess.on('error', (error) => {
          clearTimeout(timeoutId);
          resolve({
            success: false,
            error: error.message
          });
        });

      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

  private parseScriptOutput(output: string): any[] {
    if (!output.trim()) return [];

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === 'object') {
        return [parsed];
      }
    } catch (error) {
      // If not JSON, try to parse as JSONL (newline-delimited JSON)
      const lines = output.trim().split('\n');
      const records: any[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          try {
            const parsed = JSON.parse(trimmed);
            records.push(parsed);
          } catch (err) {
            // If can't parse as JSON, treat as string
            records.push({ output: trimmed });
          }
        }
      }
      
      return records;
    }

    // If nothing else works, return raw output as single record
    return [{ output: output.trim() }];
  }
}