#!/usr/bin/env node

import { program } from "commander";
import * as fs from "fs/promises";
import * as path from "path";

async function ensureDir(dirPath: string): Promise<void> {
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

async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    await fs.writeFile(filePath, content);
    console.log(`Created ${filePath}`);
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, (err as Error).message);
    process.exit(1);
  }
}

// create migration
program
  .command("migration:create <name>")
  .option(
    "-d, --destination <path>",
    "Destination to save migration file",
    "handly/migrations",
  )
  .description("Create a migration file")
  .action(async (name: string, options: { destination?: string }) => {
    const migrationDir = path.join(
      process.cwd(),
      options.destination || "handly/migrations",
    );
    await ensureDir(migrationDir);
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const migrationFile = path.join(migrationDir, `${timestamp}_${name}.ts`);
    const migrationContent = `import Database from 'better-sqlite3';

export async function up(db: Database.Database): Promise<void> {
  db.exec(\`
    CREATE TABLE IF NOT EXISTS ${name.replace(/-/g, "_")} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  \`);
}

export async function down(db: Database.Database): Promise<void> {
  db.exec('DROP TABLE IF EXISTS ${name.replace(/-/g, "_")}');
}`;
    await writeFile(migrationFile, migrationContent);
    console.log(
      `Migration ${name} generated successfully at ${migrationFile}!`,
    );
  });

program.parse(process.argv);
