import { logger } from "../utils/logger";
import { DataSource, Snapshot, QueryResult } from "../../types";
import { DatabaseService } from "./DatabaseService";

export interface SqlExecutorConfig {
  projectId: string;
  dataSources: DataSource[];
}

export class SqlExecutor {
  private static instance: SqlExecutor;
  private dbService: DatabaseService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  public static getInstance(): SqlExecutor {
    if (!SqlExecutor.instance) {
      SqlExecutor.instance = new SqlExecutor();
    }
    return SqlExecutor.instance;
  }

  async executeQuery(
    query: string,
    config: SqlExecutorConfig
  ): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      logger.info(
        "Executing SQL query",
        "data-processing",
        { query: query.trim(), projectId: config.projectId },
        "SqlExecutor"
      );

      // Parse the SQL query
      const parsedQuery = this.parseQuery(query.trim());

      // Get snapshots for the specified data source
      const snapshots = await this.getSnapshotsForDataSource(
        parsedQuery.tableName,
        config
      );

      console.log("Snapshots retrieved for query:", snapshots.length);

      if (!snapshots || snapshots.length === 0) {
        console.error("No snapshots found for table:", parsedQuery.tableName);
        throw new Error(
          `Table '${parsedQuery.tableName}' not found or has no data`
        );
      }

      // Use the latest snapshot for query execution
      const latestSnapshot = snapshots[0];
      const data = latestSnapshot.data || [];

      console.log("Using latest snapshot for query execution:", {
        snapshotId: latestSnapshot.id,
        dataSourceId: latestSnapshot.dataSourceId,
        dataLength: data.length,
        recordCount: latestSnapshot.recordCount,
        hasData: data.length > 0,
      });

      // Execute the query against the data
      const result = await this.executeQueryAgainstData(parsedQuery, data);

      console.log("Query execution result:", {
        rowCount: result.rowCount,
        columns: result.columns,
        executionTime: result.executionTime,
      });

      const executionTime = Date.now() - startTime;

      logger.success(
        "SQL query executed successfully",
        "data-processing",
        {
          tableName: parsedQuery.tableName,
          rowCount: result.rowCount,
          executionTime,
        },
        "SqlExecutor"
      );

      return {
        ...result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(
        "SQL query execution failed",
        "data-processing",
        { error, query, executionTime },
        "SqlExecutor"
      );
      throw error;
    }
  }

  private parseQuery(query: string): ParsedQuery {
    const trimmedQuery = query.trim().toUpperCase();

    // Basic SQL parsing - handle SELECT statements
    if (!trimmedQuery.startsWith("SELECT")) {
      throw new Error("Only SELECT queries are currently supported");
    }

    // Extract table name from FROM clause
    const fromMatch = query.match(/FROM\s+(\w+)/i);
    if (!fromMatch) {
      throw new Error("Query must include a FROM clause with table name");
    }

    const tableName = fromMatch[1];

    // Extract columns from SELECT clause
    const selectMatch = query.match(/SELECT\s+(.+?)\s+FROM/i);
    const columnsStr = selectMatch ? selectMatch[1] : "*";

    let columns: string[] = [];
    if (columnsStr === "*") {
      columns = ["*"]; // Will be resolved later
    } else {
      columns = columnsStr.split(",").map((col) => col.trim());
    }

    // Extract WHERE clause if present
    const whereMatch = query.match(
      /WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i
    );
    const whereClause = whereMatch ? whereMatch[1].trim() : null;

    // Extract ORDER BY clause if present
    const orderByMatch = query.match(/ORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/i);
    const orderByClause = orderByMatch ? orderByMatch[1].trim() : null;

    // Extract LIMIT clause if present
    const limitMatch = query.match(/LIMIT\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1]) : null;

    return {
      type: "SELECT",
      columns,
      tableName,
      whereClause,
      orderByClause,
      limit,
    };
  }

  private async getSnapshotsForDataSource(
    tableName: string,
    config: SqlExecutorConfig
  ): Promise<Snapshot[]> {
    console.log("SqlExecutor.getSnapshotsForDataSource called with:", {
      tableName,
      projectId: config.projectId,
      dataSourceCount: config.dataSources.length,
    });

    // Find the data source by name (case-insensitive)
    const dataSource = config.dataSources.find(
      (ds) => ds.name.toLowerCase() === tableName.toLowerCase()
    );

    console.log(
      "Found data source:",
      dataSource
        ? {
            id: dataSource.id,
            name: dataSource.name,
            type: dataSource.type,
          }
        : null
    );

    if (!dataSource) {
      console.error("Data source not found for table:", tableName);
      console.log(
        "Available data sources:",
        config.dataSources.map((ds) => ({
          id: ds.id,
          name: ds.name,
          type: ds.type,
        }))
      );
      throw new Error(`Data source '${tableName}' not found`);
    }

    // Get all snapshots for this data source
    const allSnapshots = await this.dbService.getSnapshots(config.projectId);
    console.log("All snapshots retrieved:", allSnapshots.length);
    console.log(
      "Snapshot details:",
      allSnapshots.map((s) => ({
        id: s.id,
        dataSourceId: s.dataSourceId,
        recordCount: s.recordCount,
        createdAt: s.createdAt,
        hasData: !!(s.data && s.data.length > 0),
      }))
    );

    const dataSourceSnapshots = allSnapshots
      .filter((snapshot) => snapshot.dataSourceId === dataSource.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    console.log(
      "Filtered snapshots for data source:",
      dataSourceSnapshots.length
    );
    console.log(
      "Filtered snapshot details:",
      dataSourceSnapshots.map((s) => ({
        id: s.id,
        recordCount: s.recordCount,
        createdAt: s.createdAt,
        hasData: !!(s.data && s.data.length > 0),
        dataLength: s.data ? s.data.length : 0,
      }))
    );

    return dataSourceSnapshots;
  }

  private async executeQueryAgainstData(
    parsedQuery: ParsedQuery,
    data: any[]
  ): Promise<QueryResult> {
    let resultData = [...data];

    // Resolve columns if SELECT * was used
    let columns = parsedQuery.columns;
    if (columns.length === 1 && columns[0] === "*") {
      if (data.length > 0) {
        columns = Object.keys(data[0]);
      } else {
        columns = [];
      }
    }

    // Apply WHERE clause if present
    if (parsedQuery.whereClause) {
      resultData = this.applyWhereClause(resultData, parsedQuery.whereClause);
    }

    // Apply ORDER BY clause if present
    if (parsedQuery.orderByClause) {
      resultData = this.applyOrderByClause(
        resultData,
        parsedQuery.orderByClause
      );
    }

    // Apply LIMIT clause if present
    if (parsedQuery.limit) {
      resultData = resultData.slice(0, parsedQuery.limit);
    }

    // Convert data to rows format
    const rows = resultData.map((item) => {
      return columns.map((col) => {
        const value = item[col];
        // Convert to string for display
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value === "object") {
          return JSON.stringify(value);
        }
        return String(value);
      });
    });

    return {
      columns,
      rows,
      rowCount: rows.length,
      executionTime: 0, // Will be set by caller
    };
  }

  private applyWhereClause(data: any[], whereClause: string): any[] {
    // Basic WHERE clause parsing - supports simple conditions
    // Format: column operator value (e.g., "id = 1", "name LIKE 'John%'")

    try {
      // Parse the WHERE clause
      const conditionMatch = whereClause.match(
        /(\w+)\s*(=|!=|>|<|>=|<=|LIKE)\s*(.+)/i
      );

      if (!conditionMatch) {
        throw new Error(
          "Invalid WHERE clause format. Use: column operator value"
        );
      }

      const [, column, operator, value] = conditionMatch;
      const cleanValue = value.replace(/['"]/g, ""); // Remove quotes

      return data.filter((item) => {
        const itemValue = item[column];

        switch (operator.toUpperCase()) {
          case "=":
            return itemValue == cleanValue;
          case "!=":
            return itemValue != cleanValue;
          case ">":
            return Number(itemValue) > Number(cleanValue);
          case "<":
            return Number(itemValue) < Number(cleanValue);
          case ">=":
            return Number(itemValue) >= Number(cleanValue);
          case "<=":
            return Number(itemValue) <= Number(cleanValue);
          case "LIKE":
            const pattern = cleanValue.replace(/%/g, ".*").replace(/_/g, ".");
            const regex = new RegExp(`^${pattern}$`, "i");
            return regex.test(String(itemValue));
          default:
            return true;
        }
      });
    } catch (error) {
      logger.warn(
        "Failed to parse WHERE clause, returning all data",
        "data-processing",
        { whereClause, error },
        "SqlExecutor"
      );
      return data;
    }
  }

  private applyOrderByClause(data: any[], orderByClause: string): any[] {
    try {
      // Parse ORDER BY clause - supports: column ASC/DESC
      const orderMatch = orderByClause.match(/(\w+)\s*(ASC|DESC)?/i);

      if (!orderMatch) {
        throw new Error("Invalid ORDER BY clause format. Use: column ASC/DESC");
      }

      const [, column, direction] = orderMatch;
      const isDesc = direction && direction.toUpperCase() === "DESC";

      return data.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];

        // Handle numeric values
        if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
          const result = Number(aVal) - Number(bVal);
          return isDesc ? -result : result;
        }

        // Handle string values
        const result = String(aVal).localeCompare(String(bVal));
        return isDesc ? -result : result;
      });
    } catch (error) {
      logger.warn(
        "Failed to parse ORDER BY clause, returning unsorted data",
        "data-processing",
        { orderByClause, error },
        "SqlExecutor"
      );
      return data;
    }
  }

  async getAvailableTables(projectId: string): Promise<TableInfo[]> {
    try {
      console.log(
        "SqlExecutor.getAvailableTables called for project:",
        projectId
      );

      const dataSources = await this.dbService.getDataSources(projectId);
      console.log("Data sources found:", dataSources.length);

      const tableInfos: TableInfo[] = [];

      for (const dataSource of dataSources) {
        const snapshots = await this.dbService.getSnapshots(projectId);
        const dataSourceSnapshots = snapshots
          .filter((s) => s.dataSourceId === dataSource.id)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ); // Sort by newest first

        console.log(
          `Data source ${dataSource.name} has ${dataSourceSnapshots.length} snapshots`
        );

        if (dataSourceSnapshots.length > 0) {
          const latestSnapshot = dataSourceSnapshots[0];
          const columns =
            latestSnapshot.data && latestSnapshot.data.length > 0
              ? Object.keys(latestSnapshot.data[0])
              : [];

          console.log(`Latest snapshot for ${dataSource.name}:`, {
            snapshotId: latestSnapshot.id,
            recordCount: latestSnapshot.recordCount,
            dataLength: latestSnapshot.data ? latestSnapshot.data.length : 0,
            columns: columns.length,
          });

          tableInfos.push({
            name: dataSource.name,
            type: dataSource.type,
            columnCount: columns.length,
            recordCount: latestSnapshot.recordCount || 0,
            columns,
          });
        } else {
          console.log(`No snapshots found for data source: ${dataSource.name}`);
        }
      }

      console.log("Final table infos:", tableInfos);
      return tableInfos;
    } catch (error) {
      logger.error(
        "Failed to get available tables",
        "data-processing",
        { error, projectId },
        "SqlExecutor"
      );
      return [];
    }
  }
}

interface ParsedQuery {
  type: "SELECT";
  columns: string[];
  tableName: string;
  whereClause: string | null;
  orderByClause: string | null;
  limit: number | null;
}

interface TableInfo {
  name: string;
  type: string;
  columnCount: number;
  recordCount: number;
  columns: string[];
}
