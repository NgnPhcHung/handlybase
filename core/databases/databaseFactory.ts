import { DatabaseClient } from "./databaseClient";
import { DatabaseConfig } from "./databaseConfig";
import { SqliteClient } from "./Sqlite/sqlite";

export class DatabaseFactory {
  // static create(config: DatabaseConfig): DatabaseClient {
  //   if (sharedDbClient) return sharedDbClient;
  //
  //   switch (config.type) {
  //     case "sqlite":
  //       sharedDbClient = SqliteClient.getInstance(config);
  //       break;
  //     default:
  //       throw new Error(`Unsupported DB type: ${config.type}`);
  //   }
  //
  //   return sharedDbClient;
  // }
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
