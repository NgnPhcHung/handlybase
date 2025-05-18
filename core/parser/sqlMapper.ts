import {
  SchemaRoot,
  FieldProperties,
  SQLConstrains,
  SQLType,
  KeyWords,
} from "./sqlTokens";
import { interfaceHanlders } from "./interfaceHandlers";

export class SqlMapper {
  private inputSchema?: SchemaRoot;
  private primaryKeys: string[] = [];
  constructor(data: SchemaRoot) {
    this.inputSchema = data;
  }

  getData() {
    return this.inputSchema;
  }

  private parseFields(
    fields: Record<string, FieldProperties>,
  ): FieldProperties[] {
    return Object.values(fields);
  }

  private mapFields(field: FieldProperties) {
    const name = `"${field.name}"`;
    const type = this.mapType(field);

    const constrains: string[] = [];
    if (field.primarykey) constrains.push(KeyWords.primarykey);
    if (field.autoincreasement) constrains.push(SQLConstrains.AUTOINCREMENT);
    if (field.unique) constrains.push(SQLConstrains.UNIQUE);

    this.listOfPrimaryKeys(field);
    return `${name} ${type} ${constrains.join(" ")}`;
  }

  private listOfPrimaryKeys(field: FieldProperties) {
    if (!field.primarykey) return;
    if (field.primarykey && field.autoincreasement) return;
    this.primaryKeys.push(field.name);
  }

  private mapType(field: FieldProperties) {
    const type = SQLType[field.type];
    if (!type)
      throw new Error(
        `Invalid type provided for ${field.name} at ${field.type}`,
      );

    return type;
  }

  createTableQuery() {
    if (!this.inputSchema) {
      throw new Error("Failed to create databse, please try again");
    }
    const collections = this.inputSchema.collections;
    let query = ``;

    collections.forEach((collection) => {
      const interfaceHandler = interfaceHanlders(collection.name);

      query += `
        CREATE TABLE IF NOT EXISTS ${collection.name} `;
      const fields = this.parseFields(collection.fields)
        .map((field) => {
          interfaceHandler.toPropety(field);
          return this.mapFields(field);
        })
        .join(`, `);

      const primaryKeys = this.primaryKeys.length
        ? `, \nPRIMARY KEY (${this.primaryKeys.join(",")})`
        : "";

      interfaceHandler.toInterfaceFile();
      query += `(\n${fields} ${primaryKeys})`;
      this.primaryKeys = [];
    });
    return query;
  }
}
