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
};

export enum SQLConstrains {
  AUTOINCREMENT = "AUTOINCREMENT",
  NOTNULL = "NOT NULL",
  UNIQUE = "UNIQUE",
}

export interface SchemaRoot {
  dbname: string;
  collections: CollectionSchema[];
}

export interface CollectionSchema {
  name: string;
  fields: Record<string, FieldProperties>;
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
}

export type PropertyType = "text" | "number";
