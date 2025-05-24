import { CollectionSchema } from "../parser";

export const createTablesSnapshot = (collections: CollectionSchema[]) => {
  return collections.map((collection) => {
    return {
      name: collection.name,
      references: collection.references,
      collumns: collection.fields.map((field) => {
        let notnull = true;
        if (field.required !== undefined) {
          notnull = field.required;
        }

        return {
          name: field.name,
          notnull: notnull,
          primaryKey: !!field.primarykey,
          autoincrement: field.autoincreasement,
          default: field.default,
          type: field.type,
        };
      }),
    };
  });
};
