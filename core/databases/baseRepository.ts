import { container } from "../startApp";
import { EntityClass } from "../types";
import { DatabaseClient } from "./databaseClient";

export class BaseRepository<T> {
  private db!: DatabaseClient;

  constructor(protected readonly entityClass: EntityClass<T>) {
    this.db = container.resolve(DatabaseClient);
  }

  get getDb() {
    return this.db;
  }

  async find(entity: Partial<T>) {
    const tableName = this.entityClass.name.toLowerCase();
    const keys = Object.keys(entity);
    const values = Object.values(entity);

    let sql = `SELECT * FROM ${tableName}`;
    if (keys.length > 0) {
      const whereClause = keys.map((key) => `${key} = ?`).join(" AND ");
      sql += ` WHERE ${whereClause}`;
    }

    return this.db.query<T>(this.entityClass, sql, values);
  }

  async persist<T>(entity: T): Promise<void> {}
}
