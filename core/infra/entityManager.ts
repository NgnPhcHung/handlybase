import Database, { Database as DbType } from "better-sqlite3";
import { AnyClass } from "../types/object";

type BooleanValue<T> = {
  [K in keyof T]: T[K] extends object ? BooleanValue<T[K]> : boolean;
};

interface SelectionOption<T> {
  select?: Partial<BooleanValue<T>>;
}

interface FindOneOptions<T> extends SelectionOption<T> {
  where?: Partial<T>;
}

interface UpdateOptions<T> extends SelectionOption<T> {
  entity: T | string | number;
  updateValue: Partial<T>;
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

  private find(args: any) {
    const entityName = new this.entityClass();
    const selectQuery = `${this.selectCondition} * from ${entityName.constructor.name.toLowerCase()}`;

    return this.where(args, selectQuery)?.length
      ? (this.where(args, selectQuery) as T[])
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
      return this.db.prepare(query).all(args);
    } catch (error) {
      throw new Error(`Failed while query ${this.entity}: ${error}`);
    }
  }

  findOne(opts: FindOneOptions<T>): T | null {
    const { select, where } = opts;
    this.entity = new this.entityClass().constructor.name.toLowerCase();
    this.selectCondition += "DISTINCT ";

    if (!select) {
      const res = this.find(where);

      return res ? res[0] : null;
    }

    const propertyLength = Object.entries(select).length;
    Object.entries(select).map(([key, value], index) => {
      if (typeof value !== "object") {
        const comma = index < propertyLength - 1 ? ", " : "";
        this.selectCondition += `${this.entity}.${key} ${comma}`;
      }
    });
    const query = this.selectCondition;
    const result = this.where(where, query);
    if (!result || !result.length) {
      return null;
    }
    return result[0] as T;
  }

  update({ entity, updateValue, select }: UpdateOptions<T>) {
    return this.updateMethod({ entity, updateValue, select });
  }

  private updateMethod({ entity, updateValue, select }: UpdateOptions<T>) {
    try {
      this.entity = new this.entityClass().constructor.name.toLowerCase();

      const updates = Object.keys(updateValue)
        .map((key) => `${key} = @${key}`)
        .join(", ");

      let whereClause = "";
      let whereParams: any = {};

      if (typeof entity === "string" || typeof entity === "number") {
        whereClause = `WHERE id = @id`;
        whereParams.id = entity;
      } else {
        const conditions = Object.entries(entity as object).map(
          ([key, _]) => `${key} = @${key}`,
        );
        whereClause = `WHERE ${conditions.join(" AND ")}`;
        whereParams = entity;
      }

      const query = `UPDATE ${this.entity} SET ${updates} ${whereClause}`;
      const stmt = this.db.prepare(query);

      this.db.transaction(() => {
        stmt.run({ ...updateValue, ...whereParams });
      });

      return this.findOne({ select, where: entity as any });
    } catch (error) {
      throw new Error(`Failed to update ${this.entity}: ${error}`);
    }
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
