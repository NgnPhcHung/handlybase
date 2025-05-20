import { container } from "../startApp";
import { DatabaseClient } from "./databaseClient";

export class BaseRepository<T> {
  private db!: DatabaseClient;

  constructor(protected readonly entityClass: new () => T) {
    this.db = container.resolve(DatabaseClient);
  }

  async find(entity: Partial<T>): Promise<T[] | []> {
    console.log("I am here", this.entityClass.name);
    console.log("DB in BaseRepository:", this.db);

    const tableName = this.entityClass.name.toLowerCase();
    const keys = Object.keys(entity);
    const values = Object.values(entity);

    let sql = `SELECT * FROM ${tableName}`;
    if (keys.length > 0) {
      const whereClause = keys.map((key) => `${key} = ?`).join(" AND ");
      sql += ` WHERE ${whereClause}`;
    }

    return this.db.query<T[] | []>(sql, values);
  }

  async persist<T>(entity: T): Promise<void> {}
}
