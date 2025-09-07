import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import { toCamelCase } from "./textUtils";

export function readCsv(filePath: string): Array<Record<string, any>> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileContent = fs.readFileSync(filePath, { encoding: "utf-8" });
    const workbook = XLSX.read(fileContent, { type: "string" });

    const worksheetName = workbook.SheetNames[0];
    if (!worksheetName) {
      throw new Error("No worksheets found in the CSV file");
    }

    const worksheet = workbook.Sheets[worksheetName];

    if (!worksheet) {
      throw new Error("Worksheet not found");
    }

    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const normalizedData = jsonData.map((row: any) => {
      const normalizedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[toCamelCase(key)] = value;
      }
      return normalizedRow;
    });

    return normalizedData;
  } catch (error) {
    throw new Error(
      `Error reading CSV file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export function writeCsv(
  data: Array<Record<string, any>>,
  filePath: string
): void {
  try {
    if (!Array.isArray(data)) {
      throw new Error("Data must be an array of objects");
    }

    if (data.length === 0) {
      throw new Error("Data array cannot be empty");
    }

    const normalizedData = data.map((row: any) => {
      const normalizedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        normalizedRow[toCamelCase(key)] = value;
      }
      return normalizedRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(normalizedData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    XLSX.writeFile(workbook, filePath);
  } catch (error) {
    throw new Error(
      `Error writing CSV file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
