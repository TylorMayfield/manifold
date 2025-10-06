import { DataProvider, DataProviderConfig } from "../../types";
import { clientLogger } from "../utils/ClientLogger";

export interface ScriptTemplate {
  id: string;
  name: string;
  description: string;
  language: "javascript" | "python" | "bash";
  code: string;
  example: string;
}

export class CustomScriptProvider {
  private static instance: CustomScriptProvider;

  static getInstance(): CustomScriptProvider {
    if (!CustomScriptProvider.instance) {
      CustomScriptProvider.instance = new CustomScriptProvider();
    }
    return CustomScriptProvider.instance;
  }

  // Predefined script templates
  getScriptTemplates(): ScriptTemplate[] {
    return [
      {
        id: "api-fetch",
        name: "API Data Fetcher",
        description: "Fetch data from a REST API endpoint",
        language: "javascript",
        code: `// API Data Fetcher Script
async function fetchApiData() {
  try {
    const response = await fetch('{{API_URL}}', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer {{API_TOKEN}}'
      }
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API fetch failed:', error);
    throw error;
  }
}

// Return the data
return await fetchApiData();`,
        example: "https://jsonplaceholder.typicode.com/posts",
      },
      {
        id: "csv-parser",
        name: "CSV Parser",
        description: "Parse CSV data from a URL or string",
        language: "javascript",
        code: `// CSV Parser Script
function parseCSV(csvText) {
  const lines = csvText.split('\\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
  }
  
  return data;
}

// Fetch and parse CSV data
async function fetchCSVData() {
  try {
    const response = await fetch('{{CSV_URL}}');
    const csvText = await response.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error('CSV fetch/parse failed:', error);
    throw error;
  }
}

return await fetchCSVData();`,
        example: "https://example.com/data.csv",
      },
      {
        id: "json-transform",
        name: "JSON Data Transformer",
        description: "Transform JSON data structure",
        language: "javascript",
        code: `// JSON Data Transformer Script
function transformData(rawData) {
  return rawData.map(item => ({
    id: item.id,
    name: item.title || item.name,
    description: item.body || item.description,
    createdAt: new Date().toISOString(),
    // Add your custom transformations here
  }));
}

// Process the data
async function processData() {
  try {
    const response = await fetch('{{JSON_URL}}');
    const rawData = await response.json();
    return transformData(rawData);
  } catch (error) {
    console.error('Data processing failed:', error);
    throw error;
  }
}

return await processData();`,
        example: "https://jsonplaceholder.typicode.com/users",
      },
      {
        id: "web-scraper",
        name: "Web Scraper",
        description: "Extract data from web pages (basic)",
        language: "javascript",
        code: `// Web Scraper Script (Note: Limited in browser environment)
async function scrapeData() {
  try {
    // This is a simplified example - real scraping would need a backend service
    const response = await fetch('{{TARGET_URL}}');
    const html = await response.text();
    
    // Basic text extraction (you'd use a proper HTML parser in a real implementation)
    const titleMatch = html.match(/<title>(.*?)<\\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'No title found';
    
    return [{
      url: '{{TARGET_URL}}',
      title: title,
      scrapedAt: new Date().toISOString()
    }];
  } catch (error) {
    console.error('Scraping failed:', error);
    throw error;
  }
}

return await scrapeData();`,
        example: "https://example.com",
      },
    ];
  }

  async createCustomScriptProvider(
    projectId: string,
    providerName: string,
    scriptConfig: {
      language: "javascript" | "python" | "bash";
      code: string;
      variables?: Record<string, string>;
      schedule?: string; // Cron-like schedule
    }
  ): Promise<DataProvider> {
    try {
      clientLogger.info(
        "Creating custom script provider",
        "data-processing",
        { projectId, providerName, language: scriptConfig.language },
        "CustomScriptProvider"
      );

      // Note: In a real implementation, this would:
      // 1. Validate the script syntax
      // 2. Store the script securely
      // 3. Set up execution environment
      // 4. Configure scheduling if needed

      const provider: DataProvider = {
        id: `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        name: providerName,
        type: "sql_dump",
        config: {
          customScriptConfig: {
            language: scriptConfig.language,
            code: scriptConfig.code,
            variables: scriptConfig.variables || {},
            schedule: scriptConfig.schedule,
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSyncAt: new Date(),
        status: "idle",
      };

      clientLogger.success(
        "Custom script provider created",
        "data-processing",
        {
          providerId: provider.id,
          providerName,
          language: scriptConfig.language,
        },
        "CustomScriptProvider"
      );

      return provider;
    } catch (error) {
      clientLogger.error(
        "Failed to create custom script provider",
        "data-processing",
        { error, projectId, providerName },
        "CustomScriptProvider"
      );
      throw error;
    }
  }

  async executeScript(
    providerId: string,
    variables?: Record<string, string>
  ): Promise<any[]> {
    try {
      clientLogger.info(
        "Executing custom script",
        "data-processing",
        { providerId, variables },
        "CustomScriptProvider"
      );

      // 1. Retrieve the script from storage/database
      const provider = await this.getProvider(providerId);
      if (!provider || !provider.config?.code) {
        throw new Error('Script not found or empty');
      }

      const script = provider.config.code;
      const language = provider.config.language || 'javascript';

      // 2. Set up execution environment based on language
      let results: any[] = [];

      if (language === 'javascript') {
        // Execute JavaScript directly using the JavaScript service
        const { JavaScriptDataSourceService } = await import('./JavaScriptDataSourceService');
        const jsService = new JavaScriptDataSourceService();
        
        const mergedVariables = {
          ...(provider.config.variables || {}),
          ...(variables || {}),
        };

        // Use the public executeJavaScriptScript method
        const executionResult = await jsService.executeJavaScriptScript('default', providerId, script, mergedVariables);
        results = executionResult.data || [];
      } else {
        throw new Error(`Unsupported language: ${language}. Only JavaScript is currently supported.`);
      }

      clientLogger.success(
        "Custom script executed successfully",
        "data-processing",
        { providerId, recordCount: results.length },
        "CustomScriptProvider"
      );

      return results;
    } catch (error) {
      clientLogger.error(
        "Custom script execution failed",
        "data-processing",
        { error, providerId },
        "CustomScriptProvider"
      );
      throw error;
    }
  }

  private async getProvider(providerId: string): Promise<any> {
    try {
      // Try to get from MongoDB
      const { MongoDatabase } = await import('../server/database/MongoDatabase');
      const db = MongoDatabase.getInstance();
      await db.initialize();
      
      const provider = await db.getDataSource(providerId);
      return provider;
    } catch (error) {
      clientLogger.error('Failed to get provider', 'data-processing', { error, providerId });
      return null;
    }
  }

  async validateScript(
    code: string,
    language: "javascript" | "python" | "bash"
  ): Promise<{ isValid: boolean; errors?: string[] }> {
    try {
      // Basic validation - in a real implementation, you'd use proper parsers
      if (!code.trim()) {
        return { isValid: false, errors: ["Script code cannot be empty"] };
      }

      if (language === "javascript") {
        // Basic syntax check
        try {
          new Function(code);
        } catch (error) {
          return {
            isValid: false,
            errors: [
              `JavaScript syntax error: ${
                error instanceof Error ? error.message : String(error)
              }`,
            ],
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          `Validation failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
        ],
      };
    }
  }
}

export const customScriptProvider = CustomScriptProvider.getInstance();
