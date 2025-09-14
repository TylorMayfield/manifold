import { Project, DataProvider } from "../../types";
import { DatabaseService } from "./DatabaseService";
import { MySqlProvider } from "./MySqlProvider";
import { ApiProvider } from "./ApiProvider";
import { CustomScriptProvider } from "./CustomScriptProvider";
import { logger } from "../utils/logger";

export class SampleDataGenerator {
  private static instance: SampleDataGenerator;
  private dbService = DatabaseService.getInstance();
  private mysqlProvider = MySqlProvider.getInstance();
  private apiProvider = ApiProvider.getInstance();
  private customScriptProvider = CustomScriptProvider.getInstance();

  static getInstance(): SampleDataGenerator {
    if (!SampleDataGenerator.instance) {
      SampleDataGenerator.instance = new SampleDataGenerator();
    }
    return SampleDataGenerator.instance;
  }

  /**
   * Create sample projects with data sources
   */
  async createSampleData(): Promise<void> {
    try {
      logger.info("Creating sample data", "system");

      // Check if sample data already exists
      const existingProjects = await this.dbService.getProjects();
      if (existingProjects.length > 0) {
        logger.info("Sample data already exists, skipping creation", "system");
        return;
      }

      // Create sample projects
      const project1 = await this.createSampleProject1();
      const project2 = await this.createSampleProject2();

      logger.success("Sample data created successfully", "system", {
        projectCount: 2,
        dataSourceCount: 6,
      });
    } catch (error) {
      logger.error("Failed to create sample data", "system", { error });
      throw error;
    }
  }

  /**
   * Create sample project 1 - E-commerce Analytics
   */
  private async createSampleProject1(): Promise<Project> {
    const project: Project = {
      id: "ecommerce_analytics",
      name: "E-commerce Analytics",
      description: "Analytics dashboard for online store performance",
      createdAt: new Date(),
      updatedAt: new Date(),
      dataPath: "/projects/ecommerce_analytics",
    };

    await this.dbService.createProject(project);

    // Create MySQL data source
    await this.mysqlProvider.createMySqlProvider(
      project.id,
      "Orders Database",
      {
        host: "localhost",
        port: 3306,
        database: "ecommerce_orders",
        username: "analytics_user",
        password: "secure_password",
        syncInterval: 6, // Every 6 hours
      }
    );

    // Create API data source
    await this.dbService.createDataSource({
      id: `api_${Date.now()}_stripe`,
      projectId: project.id,
      name: "Stripe API",
      type: "api",
      config: {
        apiUrl: "https://api.stripe.com/v1/payments",
        apiMethod: "GET",
        apiHeaders: {
          Authorization: "Bearer sk_test_...",
          "Content-Type": "application/json",
        },
        apiParams: {},
        apiAuthType: "bearer",
        apiAuthConfig: {
          token: "sk_test_...",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create custom script data source
    await this.customScriptProvider.createCustomScriptProvider(
      project.id,
      "Sales Report Generator",
      {
        language: "javascript",
        code: `// Generate daily sales report
async function generateSalesReport() {
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch data from multiple sources
  const orders = await fetch(\`/api/orders?date=\${today}\`);
  const payments = await fetch(\`/api/payments?date=\${today}\`);
  
  const ordersData = await orders.json();
  const paymentsData = await payments.json();
  
  // Calculate metrics
  const totalRevenue = paymentsData.reduce((sum, payment) => sum + payment.amount, 0);
  const totalOrders = ordersData.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  return {
    date: today,
    totalRevenue,
    totalOrders,
    avgOrderValue,
    orders: ordersData,
    payments: paymentsData
  };
}

return await generateSalesReport();`,
        variables: {},
        schedule: "0 8 * * *", // Daily at 8 AM
      }
    );

    return project;
  }

  /**
   * Create sample project 2 - Customer Support
   */
  private async createSampleProject2(): Promise<Project> {
    const project: Project = {
      id: "customer_support",
      name: "Customer Support Dashboard",
      description: "Customer support metrics and ticket tracking",
      createdAt: new Date(),
      updatedAt: new Date(),
      dataPath: "/projects/customer_support",
    };

    await this.dbService.createProject(project);

    // Create API data source for Zendesk
    await this.dbService.createDataSource({
      id: `api_${Date.now()}_zendesk`,
      projectId: project.id,
      name: "Zendesk API",
      type: "api",
      config: {
        apiUrl: "https://company.zendesk.com/api/v2/tickets.json",
        apiMethod: "GET",
        apiHeaders: {
          Authorization: "Basic " + btoa("email:token"),
          "Content-Type": "application/json",
        },
        apiParams: {
          sort_by: "updated_at",
          sort_order: "desc",
        },
        apiAuthType: "basic",
        apiAuthConfig: {
          username: "support@company.com",
          password: "api_token",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create API data source for Intercom
    await this.dbService.createDataSource({
      id: `api_${Date.now()}_intercom`,
      projectId: project.id,
      name: "Intercom API",
      type: "api",
      config: {
        apiUrl: "https://api.intercom.io/conversations",
        apiMethod: "GET",
        apiHeaders: {
          Authorization: "Bearer intercom_token",
          Accept: "application/json",
        },
        apiParams: {},
        apiAuthType: "bearer",
        apiAuthConfig: {
          token: "intercom_token",
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create MySQL data source for internal support metrics
    await this.mysqlProvider.createMySqlProvider(
      project.id,
      "Support Metrics DB",
      {
        host: "support-db.company.com",
        port: 3306,
        database: "support_metrics",
        username: "metrics_user",
        password: "metrics_password",
        syncInterval: 1, // Every hour
      }
    );

    return project;
  }

  /**
   * Clear all sample data
   */
  async clearSampleData(): Promise<void> {
    try {
      const projects = await this.dbService.getProjects();

      for (const project of projects) {
        // Delete project data sources
        const dataSources = await this.dbService.getDataSources(project.id);
        for (const dataSource of dataSources) {
          await this.dbService.deleteDataSource(dataSource.id, project.id);
        }

        // Delete project
        await this.dbService.deleteProject(project.id);
      }

      logger.success("Sample data cleared", "system");
    } catch (error) {
      logger.error("Failed to clear sample data", "system", { error });
      throw error;
    }
  }
}
