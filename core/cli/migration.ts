#!/usr/bin/env node

import { program } from "commander";
import deepDiff, { diff } from "deep-diff";
import { readFile } from "fs/promises";
import * as path from "path";
import { DatabaseClient } from "../databases/databaseClient";
import { DatabaseType } from "../databases/databaseConfig";
import { CollectionSchema, FieldProperties, SchemaReference } from "../parser";
import { ensureDir, getAllFiles, writeFile } from "../utils";
import { mapSQLProperties } from "../helpers/mapSqlSyntax";

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

  let query = `ALTER TABLE ${tableName} RENAME TO ${tableTemp}`;
  const newProperties = table.fields
    .map((field) => mapSQLProperties(dbType, field))
    .join(",\n");

  query += `\nCREATE TABLE ${tableName} (\n${newProperties}\n)`;
  query += `\nINSERT INTO ${tableName} SELECT ${table.fields
    .map((field) => `${tableTemp}.${field.name}`)
    .join(", ")} from ${tableTemp}`;
  query += `\nDROP TABLE ${tableTemp}`;

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

  // const oldMap = convertSchemaToHashmap(oldSchema);
  // const newMap = convertSchemaToHashmap(newSchema);

  for (const [, value] of groupDiff) {
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
          switch (changeField) {
            case "name":
              console.log("changing column name");
              const before = v.lhs;
              const after = v.rhs;
              upQueries.push(
                `ALTER TABLE ${tableName} RENAME COLUMN ${before} to ${after}`,
              );
              downQueries.push(
                `ALTER TABLE ${tableName} RENAME COLUMN ${after} to ${before}`,
              );

              break;

            case "type":
            case "primarykey":
            case "default":
            case "required":
            case "unique":
              upQueries.push(mimicTable(dbType, table));
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
    }
  }

  // newSchema.forEach((table) => {
  //   const newRows = newMap.get(table.name);
  //   // const oldRows = oldMap.get(table.name);
  //
  //   if (!newRows) {
  //     // TODO : Create new table or delete
  //   } else {
  //     // const tableName = `${table.name}`;
  //     console.log({ groupDiff });
  //
  //     // ============================
  //     // for (
  //     //   let difference = 0;
  //     //   difference < differences.length;
  //     //   difference += 2
  //     // ) {
  //     //   const d = differences[difference];
  //     //
  //     //   if (d.kind === "A") {
  //     //     if (
  //     //       d.item.kind === "D" &&
  //     //       oldRows!.fields.has((d.item.lhs as unknown as FieldProperties).name)
  //     //     ) {
  //     //       const lhs = d.item.lhs as unknown as FieldProperties;
  //     //
  //     //       upQueries.push(`ALTER TABLE ${tableName} DROP COLUMN ${lhs.name}`);
  //     //       downQueries.push(
  //     //         `ALTER TABLE ${tableName} ADD COLUMN ${mapSQLProperties(dbType, lhs)}`,
  //     //       );
  //     //     }
  //     //   } else if (d.kind === "N" && d.path && d.path.length === 1) {
  //     //     const field = (d as any).rhs;
  //     //     upQueries.push(
  //     //       `ALTER TABLE ${tableName} ADD COLUMN ${mapSQLProperties(dbType, field)}`,
  //     //     );
  //     //     downQueries.push(
  //     //       `ALTER TABLE ${tableName} DROP COLUMN ${field.name}`,
  //     //     );
  //     //   } else if (d.kind === "N" || d.kind === "E") {
  //     //     const specTable = oldSchema[d.path?.[0]];
  //     //
  //     //     const specTableName = specTable.name;
  //     //     if (tableName !== specTableName) {
  //     //       continue;
  //     //     }
  //     //     let query = `ALTER TABLE ${specTableName} RENAME TO ${specTableName}_temp`;
  //     //     const newProperties = table.fields
  //     //       .map((field) => mapSQLProperties(dbType, field))
  //     //       .join(",\n");
  //     //
  //     //     query += `\nCREATE TABLE ${specTableName} (\n${newProperties}\n)`;
  //     //     query += `\nINSERT INTO ${specTableName} SELECT * from ${specTableName}_temp`;
  //     //
  //     //     upQueries.push(query);
  //     //   }
  //     // }
  //   }
  // });
  return { upQueries, downQueries };
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

    const migrationList = getAllFiles("handly/migration");
    const sorted = migrationList.sort((a, b) => {
      const getTimestamp = (s: string) => Number(s.match(/\d{14}/)?.[0] ?? 0);

      return getTimestamp(b) - getTimestamp(a);
    });
    const [newSchema, oldSchema] = await Promise.all(
      [sorted[0], sorted[1]].map(async (file) => {
        return JSON.parse(
          await readFile(path.join("handly/migration", file), "utf8"),
        ) as CollectionSchema[];
      }),
    );

    const { upQueries, downQueries } = await generateMigration(
      dbType,
      oldSchema,
      newSchema,
    );

    console.log({ upQueries, downQueries });

    // const generatedMigrations = await generateMigration(
    //   dbType,
    //   oldSchema,
    //   newSchema,
    // );

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
  });

program.parse(process.argv);
