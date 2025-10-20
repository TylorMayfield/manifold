import fs from "fs";
import path from "path";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  DataSource,
  DataSourceConfig,
  Snapshot,
  TableSchema,
  ColumnSchema,
  ImportProgress,
} from "../../types";

export class FileImporter {
  private static instance: FileImporter;

  static getInstance(): FileImporter {
    if (!FileImporter.instance) {
      FileImporter.instance = new FileImporter();
    }
    return FileImporter.instance;
  }

  async importFile(
    filePath: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{ data: any[]; schema: TableSchema }> {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".csv") {
      return this.importCSV(filePath, onProgress);
    } else if (ext === ".json") {
      return this.importJSON(filePath, onProgress);
    } else if (ext === ".xls" || ext === ".xlsx" || ext === ".xlsm") {
      return this.importExcel(filePath, onProgress);
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  private async importCSV(
    filePath: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{ data: any[]; schema: TableSchema }> {
    return new Promise((resolve, reject) => {
      onProgress?.({
        stage: "reading",
        progress: 0,
        message: "Reading CSV file...",
      });

      const fileContent = fs.readFileSync(filePath, "utf-8");
      onProgress?.({
        stage: "parsing",
        progress: 25,
        message: "Parsing CSV data...",
      });

      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          onProgress?.({
            stage: "indexing",
            progress: 75,
            message: "Analyzing data structure...",
          });

          if (results.errors.length > 0) {
            onProgress?.({
              stage: "error",
              progress: 0,
              message: "CSV parsing failed",
              error: results.errors[0].message,
            });
            reject(
              new Error(`CSV parsing failed: ${results.errors[0].message}`)
            );
            return;
          }

          const data = results.data as any[];
          const schema = this.inferSchema(data);

          onProgress?.({
            stage: "complete",
            progress: 100,
            message: "Import completed successfully",
          });
          resolve({ data, schema });
        },
        error: (error: any) => {
          onProgress?.({
            stage: "error",
            progress: 0,
            message: "Failed to parse CSV",
            error: error.message,
          });
          reject(error);
        },
      });
    });
  }

  private async importJSON(
    filePath: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{ data: any[]; schema: TableSchema }> {
    try {
      onProgress?.({
        stage: "reading",
        progress: 0,
        message: "Reading JSON file...",
      });

      const fileContent = fs.readFileSync(filePath, "utf-8");
      onProgress?.({
        stage: "parsing",
        progress: 50,
        message: "Parsing JSON data...",
      });

      const jsonData = JSON.parse(fileContent);
      const data = Array.isArray(jsonData) ? jsonData : [jsonData];

      onProgress?.({
        stage: "indexing",
        progress: 75,
        message: "Analyzing data structure...",
      });
      const schema = this.inferSchema(data);

      onProgress?.({
        stage: "complete",
        progress: 100,
        message: "Import completed successfully",
      });
      return { data, schema };
    } catch (error) {
      onProgress?.({
        stage: "error",
        progress: 0,
        message: "Failed to parse JSON",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async importExcel(
    filePath: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{ data: any[]; schema: TableSchema }> {
    try {
      onProgress?.({
        stage: "reading",
        progress: 0,
        message: "Reading Excel file...",
      });

      const fileBuffer = fs.readFileSync(filePath);
      onProgress?.({
        stage: "parsing",
        progress: 25,
        message: "Parsing Excel data...",
      });

      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("No sheets found in Excel file");
      }

      // Use the first sheet by default
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      onProgress?.({
        stage: "indexing",
        progress: 50,
        message: `Processing sheet "${sheetName}"...`,
      });

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as any[];

      onProgress?.({
        stage: "indexing",
        progress: 75,
        message: "Analyzing data structure...",
      });
      const schema = this.inferSchema(data);

      onProgress?.({
        stage: "complete",
        progress: 100,
        message: "Import completed successfully",
      });
      return { data, schema };
    } catch (error) {
      onProgress?.({
        stage: "error",
        progress: 0,
        message: "Failed to parse Excel",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private inferSchema(data: any[]): TableSchema {
    if (data.length === 0) {
      return { columns: [] };
    }

    const sampleRecord = data[0];
    const columns: ColumnSchema[] = [];

    for (const [key, value] of Object.entries(sampleRecord)) {
      const column: ColumnSchema = {
        name: key,
        type: this.inferColumnType(value),
        nullable: value === null || value === undefined || value === "",
        unique: false,
      };
      columns.push(column);
    }

    return { columns };
  }

  private inferColumnType(
    value: any
  ): "string" | "number" | "boolean" | "date" {
    if (value === null || value === undefined) {
      return "string"; // Default type for null values
    }

    if (typeof value === "number") {
      return "number";
    }

    if (typeof value === "boolean") {
      return "boolean";
    }

    // Check if it's a date string
    if (typeof value === "string") {
      const date = new Date(value);
      if (!isNaN(date.getTime()) && value.length > 8) {
        // Basic date detection
        return "date";
      }
    }

    return "string";
  }

  async createDataSourceFromFile(
    projectId: string,
    filePath: string,
    name: string,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<DataSource> {
    const { data, schema } = await this.importFile(filePath, onProgress);

    const ext = path.extname(filePath).toLowerCase().slice(1);
    const fileType = (ext === "xls" || ext === "xlsx" || ext === "xlsm") ? "excel" : ext as "csv" | "json" | "excel";
    
    const config: DataSourceConfig = {
      filePath,
      fileType,
    };

    const dataSource: DataSource = {
      id: `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      name,
      type: fileType === "json" ? "json" : fileType === "excel" ? "excel" : "csv",
      config,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataSource;
  }
}
