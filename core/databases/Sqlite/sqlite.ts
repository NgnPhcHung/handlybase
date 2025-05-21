import SqliteDatabase from "better-sqlite3";
import { EntityClass } from "../../types";
import { DatabaseClient } from "../databaseClient";
import { SqliteConfig } from "../databaseConfig";

export class SqliteClient extends DatabaseClient {
  private static instance: SqliteClient;
  private db?: SqliteDatabase.Database;

  constructor(private dbConfig: SqliteConfig) {
    super();
  }

  static getInstance(config: SqliteConfig): SqliteClient {
    console.log(config);

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
  query<T = any>(
    entity: EntityClass<T>,
    sql: string,
    params?: any[],
  ): Promise<T> {
    console.log("Running query:", sql, params, entity);
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
