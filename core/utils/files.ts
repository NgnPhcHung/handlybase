import { readdirSync } from "fs";
import * as fs from "fs/promises";

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    console.error(
      `Error creating directory ${dirPath}:`,
      (err as Error).message,
    );
    process.exit(1);
  }
}

export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  try {
    await fs.writeFile(filePath, content);
    console.log(`Created ${filePath}`);
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, (err as Error).message);
    process.exit(1);
  }
}

export async function appendOrCreate(file: string, content: string) {
  try {
    await fs.access(file);
    await fs.appendFile(file, content);
  } catch {
    await fs.writeFile(file, content);
  }
}

export function getAllFiles(directoryPath: string) {
  try {
    const files = readdirSync(directoryPath);
    return files.map((file) => file);
  } catch (err) {
    console.error("Error reading directory:", err);
    return [];
  }
}
