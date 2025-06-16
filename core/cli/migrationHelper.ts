import deepDiff, { diff } from "deep-diff";
import * as path from "path";
import { DatabaseType } from "../databases/databaseConfig";
import { mapSQLProperties } from "../helpers/mapSqlSyntax";
import { CollectionSchema, FieldProperties, SchemaReference } from "../parser";

export type Diff = deepDiff.Diff<CollectionSchema[], CollectionSchema[]>;

export interface NormalizedCollectionSchema {
  name: string;
  references?: SchemaReference[];
  fields: Map<string, FieldProperties>;
}

export type PropertyKeys<T> = {
  [K in keyof T]: K;
};

export const groupByDiff = (input: Diff[]) => {
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

export async function loadDatasource(filepath: string) {
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

export const mimicTable = (dbType: DatabaseType, table: CollectionSchema) => {
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

function mapToSqlType(type: "number" | "text" | "boolean"): string {
  switch (type) {
    case "number":
      return "INTEGER";
    case "text":
      return "TEXT";
    case "boolean":
      return "INTEGER";
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
}

function generateSqlSchema(schema: CollectionSchema[]): string[] {
  const sqlStatements: string[] = [];

  for (const table of schema) {
    const tableName = table.name;
    const columns: string[] = [];

    for (const field of table.fields) {
      let columnDefinition = `${field.name} ${mapToSqlType(field.type)}`;

      if (field.primarykey) {
        if (field.type === "number") {
          columnDefinition += " PRIMARY KEY";
          if (field.autoincreasement) {
            columnDefinition += " AUTOINCREMENT";
          }
        } else {
          console.warn(
            `Warning: Primary key '${field.name}' in table '${tableName}' is not of type 'number'. AUTOINCREMENT will be ignored.`,
          );
          columnDefinition += " PRIMARY KEY";
        }
      }

      if (field.required) {
        columnDefinition += " NOT NULL";
      }

      if (field.unique) {
        columnDefinition += " UNIQUE";
      }

      // Default values
      if (field.default !== undefined) {
        let defaultValue = field.default;
        if (typeof defaultValue === "string") {
          defaultValue = `'${defaultValue}'`;
        }
        if (field.type === "boolean") {
          columnDefinition += ` DEFAULT ${defaultValue === "true" ? 1 : 0}`;
        } else {
          columnDefinition += ` DEFAULT ${defaultValue}`;
        }
      } else if (field.oncreate) {
        columnDefinition += ` DEFAULT CURRENT_TIMESTAMP`;
      } else if (field.onupdate) {
        columnDefinition += ` DEFAULT CURRENT_TIMESTAMP`;
      }

      columns.push(columnDefinition);
    }

    if (columns.length === 0) {
      console.warn(
        `Warning: Table '${tableName}' has no valid fields to create.`,
      );
      continue;
    }

    const createTableSql = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.join(",\n  ")}\n);`;
    sqlStatements.push(createTableSql);
  }

  return sqlStatements;
}

export const generateMigration = async (
  dbType: DatabaseType,
  oldSchema: CollectionSchema[],
  newSchema: CollectionSchema[],
) => {
  let upQueries: string[] = [];
  let downQueries: string[] = [];

  if (oldSchema === undefined) {
    const query = generateSqlSchema(newSchema);
    query.map((q) => upQueries.push(q));
    return { upQueries, downQueries };
  }

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
