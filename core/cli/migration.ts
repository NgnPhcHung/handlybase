#!/usr/bin/env node

import { program } from "commander";
import * as path from "path";
import { ensureDir, writeFile } from "../utils";
import { DatabaseClient } from "../databases/databaseClient";

async function loadDatasource(filepath: string) {
  const fullPath = path.resolve(process.cwd(), filepath);
  const mod = await import(fullPath);
  if (!mod.datasource) {
    throw new Error("Datasource not exported as 'datasource'");
  }
  return mod.datasource;
}

program
  .command("migration:create <name>")
  .option(
    "-c, --config <path>",
    "Path to the datasource config file",
    "./datasource.ts",
  )
  .description("Create a migration file based on datasource config")
  .action(async (name: string, options: { config?: string }) => {
    const database: DatabaseClient = await loadDatasource(options.config!);

    const migrationDir = path.resolve(process.cwd(), "handly/migration");
    await ensureDir(migrationDir);

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const migrationFile = path.join(migrationDir, `${timestamp}_${name}.ts`);

    database.connect();
    const result = (await database.query(
      "SELECT sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%';",
    )) as any[];
    console.log(result);

    const migrationContent = `import Database from 'better-sqlite3';

export async function up(db: DatabaseClient): Promise<void> {
}

export async function down(db: Database.Database): Promise<void> {
}
`;

    await writeFile(migrationFile, migrationContent);
  });

program.parse(process.argv);
