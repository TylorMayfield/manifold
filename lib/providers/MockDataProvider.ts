import {
  DataSource,
  DataSourceConfig,
  Snapshot,
  TableSchema,
  ColumnSchema,
} from "../../types";
import { logger } from "../utils/logger";

export interface MockDataConfig {
  recordCount: number;
  schema: TableSchema;
  dataTypes: {
    [columnName: string]:
      | "string"
      | "number"
      | "boolean"
      | "date"
      | "email"
      | "phone"
      | "name"
      | "address"
      | "company"
      | "url";
  };
  seed?: number; // For reproducible data
}

export class MockDataProvider {
  private static instance: MockDataProvider;

  static getInstance(): MockDataProvider {
    if (!MockDataProvider.instance) {
      MockDataProvider.instance = new MockDataProvider();
    }
    return MockDataProvider.instance;
  }

  async generateMockData(config: MockDataConfig): Promise<any[]> {
    logger.info(
      "Generating mock data",
      "data-processing",
      {
        recordCount: config.recordCount,
        columnCount: config.schema.columns.length,
      },
      "MockDataProvider"
    );

    const data: any[] = [];
    const seed = config.seed || Date.now();

    // Simple seeded random number generator
    let randomSeed = seed;
    const seededRandom = () => {
      randomSeed = (randomSeed * 9301 + 49297) % 233280;
      return randomSeed / 233280;
    };

    const generators = {
      string: () => this.generateRandomString(seededRandom),
      number: () => Math.floor(seededRandom() * 10000),
      boolean: () => seededRandom() > 0.5,
      date: () => this.generateRandomDate(seededRandom),
      email: () => this.generateEmail(seededRandom),
      phone: () => this.generatePhoneNumber(seededRandom),
      name: () => this.generateName(seededRandom),
      address: () => this.generateAddress(seededRandom),
      company: () => this.generateCompanyName(seededRandom),
      url: () => this.generateUrl(seededRandom),
    };

    for (let i = 0; i < config.recordCount; i++) {
      const record: any = {};

      for (const column of config.schema.columns) {
        const dataType = config.dataTypes[column.name] || column.type;
        record[column.name] = generators[dataType]();
      }

      data.push(record);
    }

    logger.success(
      "Mock data generated successfully",
      "data-processing",
      {
        recordCount: data.length,
      },
      "MockDataProvider"
    );

    return data;
  }

  async createMockDataSource(
    projectId: string,
    name: string,
    config: MockDataConfig
  ): Promise<DataSource> {
    logger.info(
      "Creating mock data source",
      "data-processing",
      {
        projectId,
        name,
        recordCount: config.recordCount,
      },
      "MockDataProvider"
    );

    const data = await this.generateMockData(config);

    const dataSource: DataSource = {
      id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      name,
      type: "mock",
      config: {
        mockConfig: config,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSyncAt: new Date(),
      status: "completed",
    };

    logger.success(
      "Mock data source created",
      "data-processing",
      {
        dataSourceId: dataSource.id,
        recordCount: data.length,
      },
      "MockDataProvider"
    );

    return dataSource;
  }

  async createSnapshot(dataSourceId: string, data: any[]): Promise<Snapshot> {
    const schema: TableSchema = {
      columns: Object.keys(data[0] || {}).map((key) => ({
        name: key,
        type: this.inferType(data[0][key]),
        nullable: false,
        unique: false,
      })),
    };

    const snapshot: Snapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataSourceId,
      version: 1,
      data,
      schema,
      createdAt: new Date(),
      recordCount: data.length,
    };

    return snapshot;
  }

  private inferType(value: any): "string" | "number" | "boolean" | "date" {
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (value instanceof Date) return "date";
    if (typeof value === "string") {
      const date = new Date(value);
      if (!isNaN(date.getTime()) && value.length > 8) {
        return "date";
      }
    }
    return "string";
  }

  private generateRandomString(random: () => number): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    const length = Math.floor(random() * 10) + 5;
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(random() * chars.length));
    }
    return result;
  }

  private generateRandomDate(random: () => number): Date {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    return new Date(
      start.getTime() + random() * (end.getTime() - start.getTime())
    );
  }

  private generateEmail(random: () => number): string {
    const domains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "company.com",
      "example.org",
    ];
    const names = [
      "john",
      "jane",
      "mike",
      "sarah",
      "david",
      "emma",
      "alex",
      "lisa",
    ];
    const name = names[Math.floor(random() * names.length)];
    const domain = domains[Math.floor(random() * domains.length)];
    return `${name}${Math.floor(random() * 100)}@${domain}`;
  }

  private generatePhoneNumber(random: () => number): string {
    const areaCode = Math.floor(random() * 900) + 100;
    const exchange = Math.floor(random() * 900) + 100;
    const number = Math.floor(random() * 9000) + 1000;
    return `(${areaCode}) ${exchange}-${number}`;
  }

  private generateName(random: () => number): string {
    const firstNames = [
      "John",
      "Jane",
      "Michael",
      "Sarah",
      "David",
      "Emily",
      "Robert",
      "Jessica",
      "William",
      "Ashley",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ];
    const firstName = firstNames[Math.floor(random() * firstNames.length)];
    const lastName = lastNames[Math.floor(random() * lastNames.length)];
    return `${firstName} ${lastName}`;
  }

  private generateAddress(random: () => number): string {
    const streets = [
      "Main St",
      "Oak Ave",
      "Pine Rd",
      "Elm St",
      "Cedar Ln",
      "Maple Dr",
      "First St",
      "Second Ave",
    ];
    const cities = [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
    ];
    const street = Math.floor(random() * 9999) + 1;
    const streetName = streets[Math.floor(random() * streets.length)];
    const city = cities[Math.floor(random() * cities.length)];
    const zip = Math.floor(random() * 90000) + 10000;
    return `${street} ${streetName}, ${city}, ${zip}`;
  }

  private generateCompanyName(random: () => number): string {
    const prefixes = [
      "Global",
      "Advanced",
      "Dynamic",
      "Innovative",
      "Premium",
      "Elite",
      "Pro",
      "Smart",
    ];
    const suffixes = [
      "Corp",
      "Inc",
      "LLC",
      "Group",
      "Systems",
      "Solutions",
      "Technologies",
      "Enterprises",
    ];
    const words = [
      "Tech",
      "Data",
      "Cloud",
      "Digital",
      "Network",
      "Software",
      "Analytics",
      "Consulting",
    ];
    const prefix = prefixes[Math.floor(random() * prefixes.length)];
    const word = words[Math.floor(random() * words.length)];
    const suffix = suffixes[Math.floor(random() * suffixes.length)];
    return `${prefix} ${word} ${suffix}`;
  }

  private generateUrl(random: () => number): string {
    const domains = [
      "example.com",
      "test.org",
      "demo.net",
      "sample.io",
      "mock.co",
    ];
    const paths = [
      "",
      "/about",
      "/contact",
      "/products",
      "/services",
      "/blog",
      "/news",
    ];
    const domain = domains[Math.floor(random() * domains.length)];
    const path = paths[Math.floor(random() * paths.length)];
    return `https://${domain}${path}`;
  }

  // Predefined mock data templates
  getTemplates(): { [key: string]: MockDataConfig } {
    return {
      customers: {
        recordCount: 1000,
        schema: {
          columns: [
            { name: "id", type: "number", nullable: false, unique: true },
            { name: "name", type: "string", nullable: false },
            { name: "email", type: "string", nullable: false },
            { name: "phone", type: "string", nullable: true },
            { name: "address", type: "string", nullable: true },
            { name: "created_at", type: "date", nullable: false },
          ],
        },
        dataTypes: {
          id: "number",
          name: "name",
          email: "email",
          phone: "phone",
          address: "address",
          created_at: "date",
        },
      },
      products: {
        recordCount: 500,
        schema: {
          columns: [
            { name: "id", type: "number", nullable: false, unique: true },
            { name: "name", type: "string", nullable: false },
            { name: "price", type: "number", nullable: false },
            { name: "category", type: "string", nullable: false },
            { name: "in_stock", type: "boolean", nullable: false },
            { name: "created_at", type: "date", nullable: false },
          ],
        },
        dataTypes: {
          id: "number",
          name: "string",
          price: "number",
          category: "string",
          in_stock: "boolean",
          created_at: "date",
        },
      },
      sales: {
        recordCount: 2000,
        schema: {
          columns: [
            { name: "id", type: "number", nullable: false, unique: true },
            { name: "customer_id", type: "number", nullable: false },
            { name: "product_id", type: "number", nullable: false },
            { name: "quantity", type: "number", nullable: false },
            { name: "total", type: "number", nullable: false },
            { name: "sale_date", type: "date", nullable: false },
          ],
        },
        dataTypes: {
          id: "number",
          customer_id: "number",
          product_id: "number",
          quantity: "number",
          total: "number",
          sale_date: "date",
        },
      },
    };
  }
}

export const mockDataProvider = MockDataProvider.getInstance();
