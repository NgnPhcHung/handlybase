#!/usr/bin/env node

import { program } from "commander";
import deepDiff, { diff } from "deep-diff";
import { transformSync } from "esbuild";
import { readdirSync, readFileSync } from "fs";
import { readFile } from "fs/promises";
import * as path from "path";
import vm from "vm";
import { DatabaseClient } from "../databases/databaseClient";
import { DatabaseType } from "../databases/databaseConfig";
import { mapSQLProperties } from "../helpers/mapSqlSyntax";
import { CollectionSchema, FieldProperties, SchemaReference } from "../parser";
import { ensureDir, getAllFiles, writeFile } from "../utils";

export interface NormalizedCollectionSchema {
  name: string;
  references?: SchemaReference[];
  fields: Map<string, FieldProperties>;
}

type Diff = deepDiff.Diff<CollectionSchema[], CollectionSchema[]>;

const groupByDiff = (input: Diff[]) => {
  const grouped: Record<string, Diff[]> = {};

  for (const diff of input) {
    if (!diff.path || diff.path.length === 0) continue;

    const groupKey = diff.path[0];
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(diff);
  }

  return grouped;
};

async function loadDatasource(filepath: string) {
  const fullPath = path.resolve(process.cwd(), filepath);
  const mod = await import(fullPath);
  if (!mod.datasource) {
    throw new Error("Datasource not exported as 'datasource'");
  }
  return mod.datasource;
}

export function convertSchemaToHashmap(
  input: any[],
): Map<string, NormalizedCollectionSchema> {
  const result = new Map<string, NormalizedCollectionSchema>();

  for (const table of input) {
    const fieldMap = new Map<string, FieldProperties>();
    for (const field of table.fields) {
      fieldMap.set(field.name, field);
    }

    const tableDef: NormalizedCollectionSchema = {
      name: table.name,
      fields: fieldMap,
      references: table.references || [],
    };

    result.set(table.name, tableDef);
  }

  return result;
}

type PropertyKeys<T> = {
  [K in keyof T]: K;
};

const mimicTable = (dbType: DatabaseType, table: CollectionSchema) => {
  const tableName = table.name;
  const tableTemp = `${table.name}_temp`;
  console.log(`Need to create new table by using temp ${tableName}`);

  let query = `ALTER TABLE ${tableName} RENAME TO ${tableTemp};`;
  const newProperties = table.fields
    .map((field) => mapSQLProperties(dbType, field))
    .join(",\n");

  query += `\nCREATE TABLE ${tableName} (\n${newProperties}\n);`;
  query += `\nINSERT INTO ${tableName} SELECT * from ${tableTemp};`;
  query += `\nDROP TABLE ${tableTemp};`;

  return query;
};

const generateMigration = async (
  dbType: DatabaseType,
  oldSchema: CollectionSchema[],
  newSchema: CollectionSchema[],
) => {
  let upQueries: string[] = [];
  let downQueries: string[] = [];

  const differences = diff(oldSchema, newSchema);
  if (!differences) return { upQueries, downQueries };

  const groupDiff = Object.entries(groupByDiff(differences));

  for (let [, value] of groupDiff) {
    const valueKinds = value.map((v) => v.kind);
    for (const v of value) {
      const table = newSchema[v.path?.[0]];
      const oldTable = oldSchema[v.path?.[0]];
      const tableName = newSchema[v.path?.[0]].name;
      const changeTable = v.path?.[1] as PropertyKeys<keyof CollectionSchema>;

      switch (changeTable) {
        case "fields":
        case "references":
        case "name":
          break;
        case "map":
          if (v.kind === "E") {
            console.log("changing table name");

            upQueries.push(`ALTER TABLE ${v.lhs}  RENAME TO ${v.rhs}`);
            downQueries.push(`ALTER TABLE ${v.rhs}  RENAME TO ${v.lhs}`);
          }
          break;

        default:
          break;
      }

      if (valueKinds.includes("D")) {
        upQueries.push(mimicTable(dbType, table));
        downQueries.push(mimicTable(dbType, oldTable));
        return { upQueries, downQueries };
      }
      switch (v.kind) {
        case "N":
          break;

        case "D":
          upQueries.push(mimicTable(dbType, table));
          break;

        case "E":
          const changeField = v.path?.[3] as PropertyKeys<
            keyof FieldProperties
          >;
          const relatedDiffs = value.filter(
            (v) =>
              v.kind === "E" &&
              v.path?.[0] === v.path?.[0] && // same table
              v.path?.[1] === "fields" &&
              typeof v.path?.[2] === "number", // same field
          );

          const hasHeavyChange = relatedDiffs.some((v) => {
            const key = v.path?.[3] as keyof FieldProperties;
            return [
              "type",
              "default",
              "primarykey",
              "required",
              "unique",
            ].includes(key);
          });

          if (!hasHeavyChange && changeField === "name") {
            console.log("changing column name");
            const before = v.lhs;
            const after = v.rhs;
            upQueries.push(
              `ALTER TABLE ${tableName} RENAME COLUMN ${before} TO ${after};`,
            );
            downQueries.push(
              `ALTER TABLE ${tableName} RENAME COLUMN ${after} TO ${before};`,
            );
          } else if (hasHeavyChange) {
            upQueries.push(mimicTable(dbType, table));
          }
          switch (changeField) {
            case "name":
              break;

            case "type":
            case "primarykey":
            case "default":
            case "required":
            case "unique":
              // upQueries.push(mimicTable(dbType, table));
              break;

            case "note":
              console.log(`update note ${v.lhs} to ${v.rhs}`);
              break;

            default:
              break;
          }

          break;

        case "A":
          if (v.item.kind === "D") {
            console.log({ vdotkind: v.item.kind, lhs: v.item.lhs });
          }
          break;

        default:
          break;
      }

      value = value.filter((val) => val.kind !== v.kind);
      console.log(value);
    }
  }

  return { upQueries, downQueries };
};

const get2LastestFile = async (directory: string) => {
  const migrationList = getAllFiles(directory);
  const sorted = migrationList.sort((a, b) => {
    const getTimestamp = (s: string) => Number(s.match(/\d{14}/)?.[0] ?? 0);

    return getTimestamp(b) - getTimestamp(a);
  });

  const [newSchema, oldSchema] = await Promise.all(
    [sorted[0], sorted[1]].map(async (file) => {
      return JSON.parse(await readFile(path.join(directory, file), "utf8"));
    }),
  );

  return { newSchema, oldSchema };
};

const getFilesByRange = async (endFile: string) => {
  const directory = "handly/migration";
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

const executeMigration = async (database: DatabaseClient) => {
  const files = readdirSync("handly/migration")
    .filter((f) => f.endsWith(".ts"))
    .sort((a, b) => {
      const timeA = a.split("_")[0];
      const timeB = b.split("_")[0];
      return timeB.localeCompare(timeA);
    });

  const latestFile = files[0];
  const tsCode = readFileSync(`handly/migration/${latestFile}`, "utf-8");
  const { code: jsCode } = transformSync(tsCode, {
    loader: "ts",
    format: "cjs",
    target: "esnext",
  });
  const context: Record<string, any> = {
    require,
    console,
    DatabaseClient,
    db: database,
    module: { exports: {} },
    exports: {},
  };

  vm.createContext(context);
  Promise.resolve(
    database.execute(
      'CREATE TABLE IF NOT EXISTS migrations( "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "title" text);',
    ),
  );
  Promise.resolve(
    database.execute(
      `INSERT INTO migrations VALUES('${latestFile.split(".ts")[0]}');`,
    ),
  );
  const script = new vm.Script(jsCode + "\nup(db);");
  script.runInContext(context);
};

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
    database.connect();
    let formatName = name.split(" ").join("_");
    if (formatName === name) {
      formatName = name;
    }

    let dbType: DatabaseType;
    const typeOfDatabase = database.constructor.name.toLowerCase();
    if (typeOfDatabase.includes("sqlite")) {
      dbType = "sqlite";
    } else {
      throw "Can not found Database type";
    }
    const { newSchema, oldSchema } = await get2LastestFile("handly/snapshot");
    const { upQueries, downQueries } = await generateMigration(
      dbType,
      oldSchema,
      newSchema,
    );

    const migrationDir = path.resolve(process.cwd(), "handly/migration");
    await ensureDir(migrationDir);

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14);
    const migrationFile = path.join(
      migrationDir,
      `${timestamp}_${formatName}.ts`,
    );

    const migrationContent = `import { DatabaseClient } from "../../core/databases/databaseClient";


export async function up(db: DatabaseClient): Promise<void> {
  db.execute(\`${upQueries.flatMap((d) => d)}\`)
}

export async function down(db: DatabaseClient): Promise<void> {
  db.execute(\`${downQueries.flatMap((d) => d)}\`)
}
    `;

    await writeFile(migrationFile, migrationContent);
    await executeMigration(database);
  });

program
  .command("migration:revert")
  .option("-t, --to <file>", "Revert to destination file")
  .option("-a, --all", "Revert all")
  .description("Revert migration")
  .action(async (options: { to?: string; all?: string }) => {
    if (options.to) {
      console.log("Revert migration to ", await getFilesByRange(options.to));
      // executeMigration();
    } else if (options.all) {
      console.log("Revert all migration", getAllFiles("handly/migration"));
      // executeMigration();
    } else {
      console.log("Revert to migration before");
    }
  });

program.parse(process.argv);
