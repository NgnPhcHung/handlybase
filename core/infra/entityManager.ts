import Database, { Database as DbType } from "better-sqlite3";
import { AnyClass } from "../types/object";

export abstract class EntityManager<T> {
  abstract entityClass: AnyClass;
  private entity!: AnyClass<T>;
  private static db = new Database("database.db", {
    verbose: console.log,
  });

  constructor() {}

  get db(): DbType {
    return (this.constructor as typeof EntityManager).db;
  }

  findOne({ ...arg }: Partial<T>) {
    this.entity = new this.entityClass();
    return this.where(this.entity, { ...arg });
  }
  findAll() {
    this.entity = new this.entityClass();
    return this.db
      .prepare(`SELECT * from ${this.entity.constructor.name.toLowerCase()}`)
      .all();
  }
  private where(entity: AnyClass<T>, { ...args }: any) {
    const entityName = entity.constructor.name.toLowerCase();
    const keys = Object.keys(args)
      .map((key) => {
        return `${entityName}.${key} = @${key}`;
      })
      .join(" AND ");

    const query = `SELECT * FROM ${entityName} WHERE ${keys}`;
    return this.db.prepare(query).all(args);
  }
}
