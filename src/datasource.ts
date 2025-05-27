import { DatabaseFactory } from "../core";

export const datasource = DatabaseFactory.getDatabase({
  type: "sqlite",
  config: {
    connectionString: "database.db",
    migration: {
      migration: true,
      table: "migrations",
      migrationFolder: "handly/migrations",
    },
  },
});
