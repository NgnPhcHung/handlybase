import { DatabaseType } from "../databases/databaseConfig";
import { FieldProperties, KeyWords, SQLConstrains, SQLType } from "../parser";

export const mapSQLProperties = (
  type: DatabaseType,
  properties: FieldProperties,
) => {
  switch (type) {
    case "sqlite":
      return sqliteTableProperties(properties);

    default:
      break;
  }
};

const mapType = (field: FieldProperties) => {
  const type = SQLType[field.type];
  if (!type)
    throw new Error(`Invalid type provided for ${field.name} at ${field.type}`);

  return type;
};

const sqliteTableProperties = (property: FieldProperties) => {
  const name = `"${property.name}"`;
  const type = "";

  const constrains: string[] = [];

  constrains.push(mapType(property));
  if (property.primarykey) {
    constrains.push(SQLConstrains.NOTNULL);
    constrains.push(KeyWords.primarykey);
  }
  if (property.autoincreasement) constrains.push(SQLConstrains.AUTOINCREMENT);
  if (property.unique) constrains.push(SQLConstrains.UNIQUE);

  const required = !!property.required ? property.required : true;
  if (!property.primarykey) {
    constrains.push(required ? SQLConstrains.NOTNULL : SQLConstrains.NULL);
  }

  if (property.default !== undefined) {
    constrains.push(
      `${SQLConstrains.DEFAULT} ${property.type === "boolean" ? +property.default : property.default || ""}`,
    );
  }
  if (property.onupdate)
    constrains.push(`${SQLConstrains.DEFAULT} CURRENT_TIMESTAMP`);
  if (property.oncreate)
    constrains.push(`${SQLConstrains.DEFAULT} CURRENT_TIMESTAMP`);

  return `${name} ${type} ${constrains.join(" ")}`;
};
