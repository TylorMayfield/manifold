import { DataSource } from "../../types";

export interface DataSourceTemplate {
  id: string;
  name: string;
  description: string;
  category: "database" | "api" | "file" | "cloud";
  type: DataSource["type"];
  config: Partial<DataSource["config"]>;
  icon: string;
  tags: string[];
  popular?: boolean;
}

export const DATA_SOURCE_TEMPLATES: DataSourceTemplate[] = [
  // Database Templates
  {
    id: "mysql-local",
    name: "MySQL (Local)",
    description: "Connect to a local MySQL database",
    category: "database",
    type: "mysql",
    config: {
      mysqlConfig: {
        host: "localhost",
        port: 3306,
        database: "",
        username: "root",
        password: "",
      },
    },
    icon: "database",
    tags: ["mysql", "database", "local"],
    popular: true,
  },
  {
    id: "mysql-cloud",
    name: "MySQL (Cloud)",
    description:
      "Connect to a cloud MySQL database (AWS RDS, Google Cloud SQL, etc.)",
    category: "database",
    type: "mysql",
    config: {
      mysqlConfig: {
        host: "",
        port: 3306,
        database: "",
        username: "",
        password: "",
      },
    },
    icon: "database",
    tags: ["mysql", "database", "cloud"],
    popular: true,
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    description: "Connect to a PostgreSQL database",
    category: "database",
    type: "mysql", // Using mysql type for now, can be extended
    config: {
      mysqlConfig: {
        host: "localhost",
        port: 5432,
        database: "",
        username: "postgres",
        password: "",
      },
    },
    icon: "database",
    tags: ["postgresql", "database"],
  },
  {
    id: "mssql-local",
    name: "SQL Server (Local)",
    description: "Connect to a local Microsoft SQL Server database",
    category: "database",
    type: "mssql",
    config: {
      mssqlConfig: {
        host: "localhost",
        port: 1433,
        database: "",
        username: "sa",
        password: "",
        encrypt: true,
        trustServerCertificate: true,
        batchExport: {
          enabled: true,
          batchSize: 1000,
          noLock: true,
          pauseBetweenBatches: 100,
        },
      },
    },
    icon: "database",
    tags: ["mssql", "sqlserver", "database", "local"],
    popular: true,
  },
  {
    id: "mssql-cloud",
    name: "SQL Server (Cloud/Azure)",
    description: "Connect to Azure SQL Database or cloud-hosted SQL Server",
    category: "database",
    type: "mssql",
    config: {
      mssqlConfig: {
        host: "",
        port: 1433,
        database: "",
        username: "",
        password: "",
        encrypt: true,
        trustServerCertificate: false,
        deltaSync: {
          enabled: true,
          method: "timestamp",
          trackingColumn: "ModifiedDate",
        },
        batchExport: {
          enabled: true,
          batchSize: 5000,
          noLock: true,
        },
        queryHints: {
          noLock: true,
          maxDop: 4,
        },
      },
    },
    icon: "database",
    tags: ["mssql", "sqlserver", "database", "cloud", "azure"],
    popular: true,
  },
  {
    id: "mssql-named-instance",
    name: "SQL Server (Named Instance)",
    description: "Connect to a SQL Server named instance",
    category: "database",
    type: "mssql",
    config: {
      mssqlConfig: {
        host: "localhost",
        instanceName: "SQLEXPRESS",
        database: "",
        username: "",
        password: "",
        encrypt: true,
        trustServerCertificate: true,
      },
    },
    icon: "database",
    tags: ["mssql", "sqlserver", "database", "express"],
  },
  {
    id: "odbc-generic",
    name: "ODBC Database (Generic)",
    description: "Connect to any ODBC-compliant database",
    category: "database",
    type: "odbc",
    config: {
      odbcConfig: {
        driver: "",
        host: "localhost",
        database: "",
        username: "",
        password: "",
        batchExport: {
          enabled: true,
          batchSize: 1000,
          pauseBetweenBatches: 100,
        },
      },
    },
    icon: "database",
    tags: ["odbc", "database", "generic"],
  },
  {
    id: "odbc-access",
    name: "Microsoft Access (ODBC)",
    description: "Connect to Microsoft Access database via ODBC",
    category: "database",
    type: "odbc",
    config: {
      odbcConfig: {
        driver: "Microsoft Access Driver (*.mdb, *.accdb)",
        database: "",
        username: "",
        password: "",
        batchExport: {
          enabled: true,
          batchSize: 500,
        },
      },
    },
    icon: "database",
    tags: ["odbc", "access", "database", "microsoft"],
  },
  {
    id: "odbc-db2",
    name: "IBM DB2 (ODBC)",
    description: "Connect to IBM DB2 database via ODBC",
    category: "database",
    type: "odbc",
    config: {
      odbcConfig: {
        driver: "IBM DB2 ODBC DRIVER",
        host: "localhost",
        port: 50000,
        database: "",
        username: "",
        password: "",
        deltaSync: {
          enabled: true,
          trackingColumn: "LAST_MODIFIED",
          trackingType: "timestamp",
        },
        batchExport: {
          enabled: true,
          batchSize: 2000,
        },
      },
    },
    icon: "database",
    tags: ["odbc", "db2", "database", "ibm"],
  },
  {
    id: "odbc-dsn",
    name: "ODBC via DSN",
    description: "Connect using a pre-configured ODBC Data Source Name",
    category: "database",
    type: "odbc",
    config: {
      odbcConfig: {
        dsn: "",
        driver: "",
        database: "",
        username: "",
        password: "",
      },
    },
    icon: "database",
    tags: ["odbc", "dsn", "database"],
  },

  // API Templates
  {
    id: "rest-api",
    name: "REST API",
    description: "Connect to a REST API endpoint",
    category: "api",
    type: "api_script",
    config: {
      apiUrl: "https://api.example.com/data",
      apiMethod: "GET",
      apiHeaders: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_TOKEN",
      },
      apiParams: {},
      apiAuthType: "bearer",
      apiAuthConfig: {
        token: "YOUR_TOKEN",
      },
    },
    icon: "globe",
    tags: ["api", "rest", "json"],
    popular: true,
  },
  {
    id: "graphql-api",
    name: "GraphQL API",
    description: "Connect to a GraphQL API endpoint",
    category: "api",
    type: "api_script",
    config: {
      apiUrl: "https://api.example.com/graphql",
      apiMethod: "POST",
      apiHeaders: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_TOKEN",
      },
      apiParams: {},
      apiAuthType: "bearer",
      apiAuthConfig: {
        token: "YOUR_TOKEN",
      },
    },
    icon: "globe",
    tags: ["api", "graphql", "json"],
  },
  {
    id: "webhook",
    name: "Webhook",
    description: "Receive data via webhook endpoint",
    category: "api",
    type: "api_script",
    config: {
      apiUrl: "https://your-domain.com/webhook",
      apiMethod: "POST",
      apiHeaders: {},
      apiParams: {},
      apiAuthType: "none",
    },
    icon: "webhook",
    tags: ["api", "webhook", "realtime"],
  },

  // File Templates
  {
    id: "csv-file",
    name: "CSV File",
    description: "Import data from a CSV file",
    category: "file",
    type: "csv",
    config: {
      filePath: "",
      fileType: "csv",
    },
    icon: "file-text",
    tags: ["csv", "file", "import"],
    popular: true,
  },
  {
    id: "json-file",
    name: "JSON File",
    description: "Import data from a JSON file",
    category: "file",
    type: "csv",
    config: {
      filePath: "",
      fileType: "json",
    },
    icon: "file-text",
    tags: ["json", "file", "import"],
  },
  {
    id: "excel-file",
    name: "Excel File",
    description: "Import data from an Excel file (XLS, XLSX)",
    category: "file",
    type: "excel",
    config: {
      filePath: "",
      fileType: "excel",
    },
    icon: "file-text",
    tags: ["excel", "file", "import", "xlsx", "xls"],
    popular: true,
  },
  {
    id: "sqlite-database",
    name: "SQLite Database",
    description: "Connect to local SQLite database files",
    category: "database",
    type: "sqlite",
    config: {
      fileType: "sqlite",
      filePath: "",
      query: "SELECT * FROM main_table",
    },
    icon: "database",
    tags: ["sqlite", "database", "local"],
  },
  {
    id: "postgresql-database",
    name: "PostgreSQL Database",
    description: "Connect to PostgreSQL database with advanced features",
    category: "database",
    type: "sql",
    config: {
      dialect: "postgresql",
      host: "localhost",
      port: 5432,
      database: "",
      username: "",
      password: "",
      ssl: false,
      query: "SELECT * FROM users LIMIT 100",
    },
    icon: "database",
    tags: ["postgresql", "database", "sql"],
  },
  {
    id: "mysql-database",
    name: "MySQL Database",
    description: "Connect to MySQL database for real-time data access",
    category: "database",
    type: "sql",
    config: {
      dialect: "mysql",
      host: "localhost",
      port: 3306,
      database: "",
      username: "",
      password: "",
      ssl: false,
      query: "SELECT * FROM users LIMIT 100",
    },
    icon: "database",
    tags: ["mysql", "database", "sql"],
  },
  {
    id: "ftp-server",
    name: "FTP/SFTP Server",
    description: "Import files from FTP or SFTP servers",
    category: "file",
    type: "ftp",
    config: {
      host: "",
      port: 21,
      username: "",
      password: "",
      secure: false, // false for FTP, true for SFTP
      filePath: "/data/export.csv",
      fileType: "csv",
      hasHeaders: true,
    },
    icon: "cloud",
    tags: ["ftp", "sftp", "remote", "server"],
  },

  // SQL Dump Templates
  {
    id: "sql-dump",
    name: "SQL Dump",
    description: "Import data from a SQL dump file",
    category: "file",
    type: "sql_dump",
    config: {
      sqlPath: "",
      sqlDialect: "mysql",
    },
    icon: "database",
    tags: ["sql", "dump", "import"],
  },

  // Custom Script Templates
  {
    id: "javascript-script",
    name: "JavaScript Script",
    description: "Create a custom data source using JavaScript",
    category: "api",
    type: "sql_dump",
    config: {
      scriptLanguage: "javascript",
      scriptContent: `// Custom JavaScript data source
async function fetchData() {
  // Your custom data fetching logic here
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  return data;
}

// Return the data
return await fetchData();`,
    },
    icon: "code",
    tags: ["javascript", "script", "custom"],
  },
  {
    id: "python-script",
    name: "Python Script",
    description: "Create a custom data source using Python",
    category: "api",
    type: "sql_dump",
    config: {
      scriptLanguage: "javascript", // Using JavaScript for now since Python isn't supported
      scriptContent: `// Custom Python-style data source (using JavaScript)
// Note: This would need to be adapted for actual Python execution
async function fetchData() {
  // Your custom data fetching logic here
  const response = await fetch('https://api.example.com/data');
  const data = await response.json();
  return data;
}

// Return the data
return await fetchData();`,
    },
    icon: "code",
    tags: ["python", "script", "custom"],
  },

  // Mock Data Templates
  {
    id: "mock-users",
    name: "Mock Users Data",
    description: "Generate mock user data for testing",
    category: "api",
    type: "mock",
    config: {
      mockConfig: {
        templateId: "user-data",
        recordCount: 1000,
        schema: {
          columns: [
            { name: "id", type: "number", nullable: false },
            { name: "name", type: "string", nullable: false },
            { name: "email", type: "string", nullable: false },
            { name: "created_at", type: "date", nullable: false },
          ],
        },
        dataTypes: {
          id: "number",
          name: "string",
          email: "string",
          created_at: "date",
        },
      },
    },
    icon: "users",
    tags: ["mock", "test", "users"],
  },
  {
    id: "mock-sales",
    name: "Mock Sales Data",
    description: "Generate mock sales data for testing",
    category: "api",
    type: "mock",
    config: {
      mockConfig: {
        templateId: "product-data",
        recordCount: 5000,
        schema: {
          columns: [
            { name: "id", type: "number", nullable: false },
            { name: "product", type: "string", nullable: false },
            { name: "amount", type: "number", nullable: false },
            { name: "date", type: "date", nullable: false },
          ],
        },
        dataTypes: {
          id: "number",
          product: "string",
          amount: "number",
          date: "date",
        },
      },
    },
    icon: "trending-up",
    tags: ["mock", "test", "sales"],
  },
];

export const getTemplateById = (id: string): DataSourceTemplate | undefined => {
  return DATA_SOURCE_TEMPLATES.find((template) => template.id === id);
};

export const getTemplatesByCategory = (
  category: string
): DataSourceTemplate[] => {
  return DATA_SOURCE_TEMPLATES.filter(
    (template) => template.category === category
  );
};

export const getPopularTemplates = (): DataSourceTemplate[] => {
  return DATA_SOURCE_TEMPLATES.filter((template) => template.popular);
};

export const searchTemplates = (query: string): DataSourceTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return DATA_SOURCE_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
};
