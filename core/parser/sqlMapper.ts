import {
  SchemaRoot,
  FieldProperties,
  SQLConstrains,
  SQLType,
  KeyWords,
  SchemaReference,
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

  private mapFields(field: FieldProperties) {
    const name = `"${field.name}"`;
    const type = this.mapType(field);

    const constrains: string[] = [];
    if (field.primarykey) {
      constrains.push(SQLConstrains.NOTNULL);
      constrains.push(KeyWords.primarykey);
    }
    if (field.autoincreasement) constrains.push(SQLConstrains.AUTOINCREMENT);
    if (field.unique) constrains.push(SQLConstrains.UNIQUE);

    const required = !!field.required ? field.required : true;
    if (!field.primarykey) {
      constrains.push(required ? SQLConstrains.NOTNULL : SQLConstrains.NULL);
    }

    if (field.default !== undefined) {
      constrains.push(
        `${SQLConstrains.DEFAULT} ${field.type === "boolean" ? +field.default : field.default || ""}`,
      );
    }
    if (field.onupdate)
      constrains.push(`${SQLConstrains.DEFAULT} CURRENT_TIMESTAMP`);
    if (field.oncreate)
      constrains.push(`${SQLConstrains.DEFAULT} CURRENT_TIMESTAMP`);

    this.listOfPrimaryKeys(field);
    return `${name} ${type} ${constrains.join(" ")}`;
  }

  private listOfPrimaryKeys(field: FieldProperties) {
    if (!field.primarykey) return;
    if (field.primarykey && field.autoincreasement) return;
    this.primaryKeys.push(field.name);
  }

  private foreginKeys(references: SchemaReference[]) {
    return references.reduce((acc, cur) => {
      acc += `,\n\tFOREIGN KEY(${cur.key}) REFERENCES ${cur.targetTable}(${cur.targetKey}) ON DELETE CASCADE`;
      return acc;
    }, "");
  }

  private mapType(field: FieldProperties) {
    const type = SQLType[field.type];
    if (!type)
      throw new Error(
        `Invalid type provided for ${field.name} at ${field.type}`,
      );

    return type;
  }

  private triggerUpdate(tableName: string, rowUpdate: string) {
    const functionQuery = `CREATE TRIGGER update_${tableName}_${rowUpdate}
AFTER UPDATE ON ${tableName} 
FOR EACH ROW
BEGIN
  UPDATE ${tableName} 
  SET ${rowUpdate} = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;`;

    return functionQuery;
  }

  createTableQuery() {
    if (!this.inputSchema) {
      throw new Error("Failed to create databse, please try again");
    }
    const collections = this.inputSchema.collections;
    const query: string[] = [];
    let autoFunction = "";
    let foreignKeys = "";

    collections.forEach((collection) => {
      const interfaceHandler = interfaceHanlders(collection.name);
      let subQuery = "";

      subQuery += `
CREATE TABLE IF NOT EXISTS ${collection.name} `;
      const fields = collection.fields
        .map((field) => {
          interfaceHandler.toPropety(field);
          if (field.onupdate)
            autoFunction +=
              "\n" + this.triggerUpdate(collection.name, field.name);
          return "\n\t" + this.mapFields(field);
        })
        .join(`,`);

      if (!!collection.references) {
        foreignKeys = this.foreginKeys(collection.references);
      }

      const primaryKeys = this.primaryKeys.length
        ? `, \nPRIMARY KEY (${this.primaryKeys.join(",")})`
        : "";

      subQuery += `(${fields} ${primaryKeys} ${foreignKeys}\n);\n`;
      this.primaryKeys = [];
      query.push(subQuery);
    });
    return { query, autoFunction };
  }
}
