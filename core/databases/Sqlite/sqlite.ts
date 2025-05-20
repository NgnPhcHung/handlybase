import SqliteDatabase from "better-sqlite3";
import { DatabaseClient } from "../databaseClient";
import { SqliteConfig } from "../databaseConfig";

export class SqliteClient implements DatabaseClient {
  private static instance: SqliteClient;
  private db?: SqliteDatabase.Database;

  private constructor(private dbConfig: SqliteConfig) {}

  static getInstance(config: SqliteConfig): SqliteClient {
    if (!SqliteClient.instance) {
      SqliteClient.instance = new SqliteClient(config);
    }
    return SqliteClient.instance;
  }

  async connect() {
    try {
      const {
        config: { connectionString, ...rest },
      } = this.dbConfig;

      this.db = new SqliteDatabase(connectionString, rest);
      if (this.db) {
        console.log("Connected to SQLITE!!!!!");
      } else {
        throw new Error("Cannot connect to database");
      }
    } catch (error) {
      throw new Error(
        "Database connection string does not correct, please check that!",
      );
    }
  }
  query<T = any>(sql: string, params?: any[]): Promise<T> {
    console.log("Running query:", sql, params);
    if (!this.db) throw new Error("DB not connected");
    const stmt = this.db.prepare(sql);
    return Promise.resolve(stmt.all(params) as T).catch((error) => error);
  }

  disconnect() {
    if (this.db) {
      this.db.close();
      this.db = undefined;
      console.log("Disconnected from SQLite");
    }
  }
}
