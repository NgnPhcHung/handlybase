export const KeyWords = {
  primarykey: "PRIMARY KEY",
  foreignkey: "FOREIGN KEY",
  text: "TEXT",
  required: "NOT NULL",
  unique: "UNIQUE",
};

export const SQLType: Record<PropertyType, string> = {
  text: "TEXT",
  number: "INTEGER",
  boolean: "INTEGER",
};

export enum SQLConstrains {
  AUTOINCREMENT = "AUTOINCREMENT",
  NOTNULL = "NOT NULL",
  UNIQUE = "UNIQUE",
  NULL = "NULL",
  DEFAULT = "DEFAULT",
  COMMENT = "COMMENT",
}

export interface SchemaRoot {
  dbname: string;
  collections: CollectionSchema[];
}

export interface CollectionSchema {
  name: string;
  references?: SchemaReference[];
  fields: FieldProperties[];
}

export interface SchemaReference {
  key: string;
  targetTable: string;
  targetKey: string;
}

export interface FieldProperties {
  name: string;
  primarykey?: boolean;
  autoincreasement?: boolean;
  type: PropertyType;
  required?: boolean;
  unique?: boolean;
  oncreate?: boolean;
  onupdate?: boolean;
  presentable?: boolean;
  default?: any;
  note?: string;
}

export type PropertyType = "text" | "number" | "boolean";
