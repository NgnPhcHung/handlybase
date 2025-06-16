import { readdirSync } from "fs";
import * as fs from "fs/promises";
import * as path from "path";

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
    return readdirSync(directoryPath);
  } catch (err) {
    throw `Error reading directory: ${err}`;
  }
}

export const get2LastestFile = async (directory: string) => {
  const migrationList = getAllFiles(directory);
  const sorted = migrationList.sort((a, b) => {
    const getTimestamp = (s: string) => Number(s.match(/\d{14}/)?.[0] ?? 0);

    return getTimestamp(b) - getTimestamp(a);
  });

  const [newSchema, oldSchema] = await Promise.all(
    [sorted[0], sorted[1] || []].map(async (file) => {
      if (!!file && typeof file === "string")
        return JSON.parse(
          await fs.readFile(path.join(directory, file), "utf8"),
        );
    }),
  );

  return { newSchema, oldSchema };
};

export const getFilesByRange = async (directory: string, endFile: string) => {
  const migrationFiles = getAllFiles(directory);
  const filesRevert: string[] = [];
  const endIdx = migrationFiles.findIndex((file) => file.includes(endFile));
  if (endIdx === -1) return;

  migrationFiles.map((file, idx) => {
    if (idx !== endIdx) {
      filesRevert.push(file);
    }
  });

  return filesRevert;
};
