import Database, { Database as DbType } from "better-sqlite3";
import { AnyClass } from "../types/object";

type ToBolean<T> = {
  [K in keyof T]: T[K] extends object ? ToBolean<T[K]> : boolean;
};

interface FindOneOptions<T> {
  select?: Partial<ToBolean<T>>;
  where?: Partial<T>;
}
export abstract class EntityManager<T> {
  abstract entityClass: AnyClass;
  private entity!: AnyClass<T>;
  private static db = new Database("database.db", {
    verbose: console.log,
  });
  private selectCondition: string = "SELECT ";

  constructor() {}

  get db(): DbType {
    return (this.constructor as typeof EntityManager).db;
  }

  findAll() {
    this.entity = new this.entityClass();
    return this.db
      .prepare(
        `${this.selectCondition} * from ${this.entity.constructor.name.toLowerCase()}`,
      )
      .all();
  }

  private find({ ...args }: any) {
    const entityName = new this.entityClass();
    const selectQuery = `${this.selectCondition} * from ${entityName.constructor.name}`;

    return this.where({ ...args }, selectQuery)?.length
      ? this.where({ ...args }, selectQuery)
      : null;
  }

  private where({ ...args }: any, selectQuery: string) {
    this.entity = new this.entityClass().constructor.name.toLowerCase();

    try {
      const keys = Object.keys(args)
        .map((value) => {
          return `${this.entity}.${value} = @${value}`;
        })
        .join(" AND ");

      const query = `${selectQuery} ${args ? `WHERE ${keys}` : ""} `;

      this.selectCondition = "SELECT ";
      console.log({ query });
      return this.db.prepare(query).all(args);
    } catch (erorr) {
      throw new Error(`Failed while query ${this.entity}`);
    }
  }

  findOne(opts: FindOneOptions<T>) {
    const { select, where } = opts;
    this.entity = new this.entityClass().constructor.name.toLowerCase();
    this.selectCondition += "DISTINCT ";

    if (!select) {
      return this.find({ ...where });
    }

    const propertyLength = Object.entries(select).length;
    Object.entries(select).map(([key, value], index) => {
      if (typeof value !== "object") {
        const comma = index < propertyLength - 1 ? ", " : "";
        this.selectCondition += `${this.entity}.${key} ${comma}`;
      }
    });
    const query = this.selectCondition;
    return this.where(where, query) as T;
  }

  create({ ...args }: any): T {
    const newEntity = new this.entityClass();
    Object.entries(args).forEach(([key, value]) => {
      newEntity[key] = value;
    });
    this.saveMethod(args);
    return newEntity;
  }

  private saveMethod({ ...args }: any) {
    this.entity = new this.entityClass().constructor.name.toLowerCase();
    try {
      let insert = `INSERT INTO ${this.entity} (`;

      const argument = Object.entries(args);
      argument.forEach(([key, value], index) => {
        insert += `${key}${index < argument.length - 1 ? "," : ""}`;
      });
      insert += ") VALUES (";
      argument.forEach(([_, value], index) => {
        insert += `'${value}'${index < argument.length - 1 ? ", " : ""}`;
      });
      insert += ")";

      this.db.prepare(insert).run();
    } catch (error) {
      throw new Error(`Failed to save ${this.entity}, rollback transaction`);
    }
  }
}
