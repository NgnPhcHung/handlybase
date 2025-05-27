#!/usr/bin/env node

import { program } from "commander";
import { diff } from "deep-diff";
import { readFile } from "fs/promises";
import * as path from "path";
import { DatabaseClient } from "../databases/databaseClient";
import { CollectionSchema, FieldProperties, SchemaReference } from "../parser";
import { mapSQLProperties } from "../helpers/mapSqlSyntax";
import { DatabaseType } from "../databases/databaseConfig";
import { ensureDir, getAllFiles, writeFile } from "../utils";

export interface NormalizedCollectionSchema {
  name: string;
  references?: SchemaReference[];
  fields: Map<string, FieldProperties>;
}

async function loadDatasource(filepath: string) {
  const fullPath = path.resolve(process.cwd(), filepath);
  const mod = await import(fullPath);
  if (!mod.datasource) {
    throw new Error("Datasource not exported as 'datasource'");
  }
  return mod.datasource;
}

function convertSchemaToHashmap(
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

const generateMigration = async (
  dbType: DatabaseType,
  oldSchema: CollectionSchema[],
  newSchema: CollectionSchema[],
) => {
  let upQueries: string[] = [];
  let downQueries: string[] = [];

  const differences = diff(oldSchema, newSchema);
  if (!differences) return { upQueries, downQueries };

  const oldMap = convertSchemaToHashmap(oldSchema);
  const newMap = convertSchemaToHashmap(newSchema);

  oldSchema.forEach((table) => {
    const newRows = newMap.get(table.name);
    const oldRows = oldMap.get(table.name);

    if (!newRows) {
      // TODO : Create new table or delete
    } else {
      const differences = diff(oldSchema, newSchema);
      if (!differences) {
        return { upQueries, downQueries };
      }

      for (const d of differences) {
        const tableName = `${table.name}`;

        if (d.kind === "A") {
          if (
            d.item.kind === "D" &&
            oldRows!.fields.has((d.item.lhs as unknown as FieldProperties).name)
          ) {
            const lhs = d.item.lhs as unknown as FieldProperties;

            upQueries.push(`ALTER TABLE ${tableName} DROP COLUMN ${lhs.name}`);
            downQueries.push(
              `ALTER TABLE ${tableName} ADD COLUMN ${mapSQLProperties(dbType, lhs)}`,
            );
          }
        } else if (d.kind === "N" && d.path && d.path.length === 1) {
          const field = (d as any).rhs;
          upQueries.push(
            `ALTER TABLE ${tableName} ADD COLUMN ${mapSQLProperties(dbType, field)}`,
          );
          downQueries.push(
            `ALTER TABLE ${tableName} DROP COLUMN ${field.name}`,
          );
        } else if (d.kind === "N" || d.kind === "E") {
          const specTable = oldSchema[d.path?.[0]];

          const specTableName = specTable.name;
          if (tableName !== specTableName) {
            continue;
          }
          let query = `ALTER TABLE ${specTableName} RENAME TO ${specTableName}_temp`;
          const newProperties = table.fields
            .map((field) => mapSQLProperties(dbType, field))
            .join(",\n");

          query += `\nCREATE TABLE ${specTableName} (\n${newProperties}\n)`;
          query += `\nINSERT INTO ${specTableName} SELECT * from ${specTableName}_temp`;

          upQueries.push(query);
        }
      }
    }
  });
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
      [sorted[0], sorted[1]].map(
        async (file) =>
          JSON.parse(
            await readFile(path.join("handly/migration", file), "utf8"),
          ) as CollectionSchema[],
      ),
    );

    const generatedMigrations = await generateMigration(
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
    const migrationFile = path.join(migrationDir, `${timestamp}_${name}.ts`);

    const migrationContent = `import { DatabaseClient } from "../../core/databases/databaseClient";


    export async function up(db: DatabaseClient): Promise<void> {
        db.execute(\`${generatedMigrations.upQueries}\`)
    }

    export async function down(db: DatabaseClient): Promise<void> {
        db.execute(\`${generatedMigrations.downQueries}\`)
    }
    `;

    await writeFile(migrationFile, migrationContent);
  });

program.parse(process.argv);
