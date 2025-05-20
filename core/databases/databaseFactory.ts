import { DatabaseClient } from "./databaseClient";
import { DatabaseConfig } from "./databaseConfig";
import { SqliteClient } from "./Sqlite/sqlite";

export class DatabaseFactory {
  static getDatabase({ type, config }: DatabaseConfig): DatabaseClient {
    switch (type) {
      case "sqlite":
        return SqliteClient.getInstance({
          config: config,
        });
      default:
        throw new Error(`Unsupported DB type: ${type}`);
    }
  }
}
