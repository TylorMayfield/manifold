import { DataProvider, Snapshot, TableSchema, ColumnSchema } from "../../types";

export interface MockTemplate {
  id: string;
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "date";
    generator: string;
  }>;
  recordCount: number;
}

const mockTemplates: { [key: string]: MockTemplate } = {
  "user-data": {
    id: "user-data",
    name: "User Data",
    description: "Generate user profiles with names, emails, and addresses",
    fields: [
      { name: "id", type: "number", generator: "autoIncrement" },
      { name: "first_name", type: "string", generator: "firstName" },
      { name: "last_name", type: "string", generator: "lastName" },
      { name: "email", type: "string", generator: "email" },
      { name: "phone", type: "string", generator: "phone" },
      { name: "city", type: "string", generator: "city" },
      { name: "country", type: "string", generator: "country" },
      { name: "created_at", type: "date", generator: "pastDate" },
    ],
    recordCount: 1000,
  },
  "product-data": {
    id: "product-data",
    name: "Product Data",
    description: "Generate product catalog with names, prices, and categories",
    fields: [
      { name: "id", type: "number", generator: "autoIncrement" },
      { name: "name", type: "string", generator: "productName" },
      { name: "category", type: "string", generator: "category" },
      { name: "price", type: "number", generator: "price" },
      { name: "stock", type: "number", generator: "stock" },
      { name: "description", type: "string", generator: "description" },
      { name: "created_at", type: "date", generator: "pastDate" },
    ],
    recordCount: 500,
  },
  "sales-data": {
    id: "sales-data",
    name: "Sales Data",
    description: "Generate sales transactions with amounts and dates",
    fields: [
      { name: "id", type: "number", generator: "autoIncrement" },
      { name: "transaction_id", type: "string", generator: "transactionId" },
      { name: "customer_id", type: "number", generator: "customerId" },
      { name: "product_id", type: "number", generator: "productId" },
      { name: "quantity", type: "number", generator: "quantity" },
      { name: "amount", type: "number", generator: "amount" },
      { name: "sale_date", type: "date", generator: "recentDate" },
      { name: "status", type: "string", generator: "saleStatus" },
    ],
    recordCount: 2500,
  },
  customers: {
    id: "customers",
    name: "Customer Data",
    description:
      "Generate customer profiles with names, emails, and demographics",
    fields: [
      { name: "id", type: "number", generator: "autoIncrement" },
      { name: "first_name", type: "string", generator: "firstName" },
      { name: "last_name", type: "string", generator: "lastName" },
      { name: "email", type: "string", generator: "email" },
      { name: "phone", type: "string", generator: "phone" },
      { name: "city", type: "string", generator: "city" },
      { name: "country", type: "string", generator: "country" },
      { name: "created_at", type: "date", generator: "pastDate" },
    ],
    recordCount: 1000,
  },
  orders: {
    id: "orders",
    name: "Order Data",
    description: "E-commerce orders with products, quantities, and pricing",
    fields: [
      { name: "order_id", type: "string", generator: "orderCode" },
      { name: "customer_id", type: "number", generator: "customerId" },
      { name: "product_name", type: "string", generator: "productName" },
      { name: "quantity", type: "number", generator: "quantity" },
      { name: "price", type: "number", generator: "price" },
      { name: "order_date", type: "date", generator: "recentDate" },
      { name: "status", type: "string", generator: "orderStatus" },
    ],
    recordCount: 2500,
  },
  products: {
    id: "products",
    name: "Product Catalog",
    description: "Product information with categories, pricing, and inventory",
    fields: [
      { name: "product_id", type: "string", generator: "productCode" },
      { name: "name", type: "string", generator: "productName" },
      { name: "category", type: "string", generator: "category" },
      { name: "price", type: "number", generator: "price" },
      { name: "stock_quantity", type: "number", generator: "stock" },
      { name: "description", type: "string", generator: "productDescription" },
    ],
    recordCount: 500,
  },
  analytics: {
    id: "analytics",
    name: "Analytics Data",
    description: "Website analytics with page views, sessions, and conversions",
    fields: [
      { name: "date", type: "date", generator: "dateSequence" },
      { name: "page_views", type: "number", generator: "pageViews" },
      { name: "unique_visitors", type: "number", generator: "visitors" },
      { name: "bounce_rate", type: "number", generator: "percentage" },
      { name: "conversion_rate", type: "number", generator: "percentage" },
    ],
    recordCount: 365,
  },
};

// Data generators
const generators = {
  autoIncrement: (index: number) => index + 1,
  firstName: () => {
    const names = [
      "John",
      "Jane",
      "Mike",
      "Sarah",
      "David",
      "Emma",
      "Chris",
      "Lisa",
      "Tom",
      "Anna",
    ];
    return names[Math.floor(Math.random() * names.length)];
  },
  lastName: () => {
    const names = [
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
    return names[Math.floor(Math.random() * names.length)];
  },
  email: () => {
    const domains = ["example.com", "test.com", "demo.org", "sample.net"];
    const username = Math.random().toString(36).substring(7);
    return `${username}@${domains[Math.floor(Math.random() * domains.length)]}`;
  },
  phone: () => {
    return `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(
      Math.random() * 900 + 100
    )}-${Math.floor(Math.random() * 9000 + 1000)}`;
  },
  city: () => {
    const cities = [
      "New York",
      "London",
      "Paris",
      "Tokyo",
      "Sydney",
      "Toronto",
      "Berlin",
      "Amsterdam",
      "Barcelona",
      "Rome",
    ];
    return cities[Math.floor(Math.random() * cities.length)];
  },
  country: () => {
    const countries = [
      "USA",
      "UK",
      "France",
      "Japan",
      "Australia",
      "Canada",
      "Germany",
      "Netherlands",
      "Spain",
      "Italy",
    ];
    return countries[Math.floor(Math.random() * countries.length)];
  },
  pastDate: () => {
    const now = new Date();
    const past = new Date(
      now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000
    );
    return past.toISOString().split("T")[0];
  },
  recentDate: () => {
    const now = new Date();
    const recent = new Date(
      now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
    );
    return recent.toISOString().split("T")[0];
  },
  dateSequence: (index: number) => {
    const start = new Date();
    start.setDate(start.getDate() - index);
    return start.toISOString().split("T")[0];
  },
  orderCode: (index: number) => `ORD${String(index + 1).padStart(6, "0")}`,
  productCode: (index: number) => `PRD${String(index + 1).padStart(4, "0")}`,
  customerId: () => Math.floor(Math.random() * 1000) + 1,
  productName: () => {
    const products = [
      "Laptop",
      "Mouse",
      "Keyboard",
      "Monitor",
      "Webcam",
      "Headphones",
      "Speaker",
      "Tablet",
      "Phone",
      "Charger",
    ];
    return products[Math.floor(Math.random() * products.length)];
  },
  quantity: () => Math.floor(Math.random() * 10) + 1,
  price: () => Math.round((Math.random() * 1000 + 10) * 100) / 100,
  orderStatus: () => {
    const statuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  },
  category: () => {
    const categories = [
      "Electronics",
      "Accessories",
      "Software",
      "Hardware",
      "Gaming",
      "Office",
      "Mobile",
      "Audio",
      "Video",
      "Storage",
    ];
    return categories[Math.floor(Math.random() * categories.length)];
  },
  stock: () => Math.floor(Math.random() * 100),
  productDescription: () =>
    "High-quality product with excellent features and reliable performance.",
  description: () =>
    "High-quality product with excellent features and reliable performance.",
  transactionId: (index: number) => `TXN${String(index + 1).padStart(6, "0")}`,
  productId: () => Math.floor(Math.random() * 500) + 1,
  amount: () => Math.round((Math.random() * 500 + 10) * 100) / 100,
  saleStatus: () => {
    const statuses = ["completed", "pending", "cancelled", "refunded"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  },
  pageViews: () => Math.floor(Math.random() * 10000) + 100,
  visitors: () => Math.floor(Math.random() * 5000) + 50,
  percentage: () => Math.round(Math.random() * 100 * 100) / 100,
};

export function generateMockData(
  templateId: string,
  recordCount?: number
): Snapshot {
  const template = mockTemplates[templateId];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  const count = recordCount || template.recordCount;
  const sourceId = `mock_${template.id}_${Date.now()}`;

  // Generate the actual data
  const data = Array.from({ length: count }, (_, index) => {
    const record: any = {};
    template.fields.forEach((field) => {
      const generator = generators[field.generator as keyof typeof generators];
      if (generator) {
        record[field.name] = generator(index);
      } else {
        record[field.name] = `${field.name}_${index + 1}`;
      }
    });
    return record;
  });

  // Create schema
  const columns: ColumnSchema[] = template.fields.map((field) => ({
    name: field.name,
    type: field.type,
    nullable: false,
    unique: field.name === "id" || field.name.includes("_id"),
  }));

  const schema: TableSchema = {
    columns,
    primaryKeys: columns
      .filter((col) => col.name === "id" || col.name.includes("_id"))
      .map((col) => col.name),
  };

  // Create snapshot
  const snapshot: Snapshot = {
    id: `snapshot_${sourceId}_${Date.now()}`,
    dataSourceId: sourceId,
    projectId: "default",
    version: 1,
    data,
    schema,
    recordCount: count,
    metadata: {
      template: template.name,
      generatedAt: new Date(),
      seed: Date.now(),
    },
    createdAt: new Date(),
  };

  return snapshot;
}

export function getMockTemplate(templateId: string): MockTemplate | undefined {
  return mockTemplates[templateId];
}

export function getAllMockTemplates(): MockTemplate[] {
  return Object.values(mockTemplates);
}
