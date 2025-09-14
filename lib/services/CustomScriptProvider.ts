import { DataProvider, DataProviderConfig } from "../../types";
import { logger } from "../utils/logger";

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
      logger.info(
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
        type: "custom_script",
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

      logger.success(
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
      logger.error(
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
      logger.info(
        "Executing custom script",
        "data-processing",
        { providerId, variables },
        "CustomScriptProvider"
      );

      // Note: In a real implementation, this would:
      // 1. Retrieve the script from storage
      // 2. Set up a secure execution environment
      // 3. Execute the script with proper sandboxing
      // 4. Return the results

      // For now, we'll simulate execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const mockData = [
        { id: 1, name: "Sample Data 1", value: "Generated by script" },
        { id: 2, name: "Sample Data 2", value: "Generated by script" },
        { id: 3, name: "Sample Data 3", value: "Generated by script" },
      ];

      logger.success(
        "Custom script executed successfully",
        "data-processing",
        { providerId, recordCount: mockData.length },
        "CustomScriptProvider"
      );

      return mockData;
    } catch (error) {
      logger.error(
        "Custom script execution failed",
        "data-processing",
        { error, providerId },
        "CustomScriptProvider"
      );
      throw error;
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
