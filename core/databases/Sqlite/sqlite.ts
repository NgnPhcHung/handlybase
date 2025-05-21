import SqliteDatabase from "better-sqlite3";
import { EntityClass } from "../../types";
import {
  BooleanValue,
  DatabaseClient,
  MethodOptions,
  SelectionOption,
} from "../databaseClient";
import { SqliteConfig } from "../databaseConfig";

interface CommonSettingOpts<T> extends MethodOptions<T> {
  entityClass: EntityClass<T>;
}
type KeysOfClass<T extends new (...args: any) => any> = keyof InstanceType<T>;
export class SqliteClient extends DatabaseClient {
  private static instance: SqliteClient;
  private db!: SqliteDatabase.Database;

  constructor(private dbConfig: SqliteConfig) {
    super();
  }

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
  query<T = any>(_: EntityClass<T>, sql: string, params?: any[]): Promise<T> {
    if (!this.db) throw new Error("DB not connected");
    const stmt = this.db.prepare(sql);
    return Promise.resolve(stmt.all(params) as T).catch((error) => error);
  }

  async find<T>(
    entityClass: EntityClass<T>,
    { where, select }: MethodOptions<T>,
  ): Promise<T[] | []> {
    const { selectQuery, whereCondition } = this.commonSettings({
      entityClass,
      select,
      where,
    });

    const query = `${selectQuery} ${whereCondition}`;

    const queryResult = (await Promise.resolve(
      this.db.prepare(query).all(),
    )) as T[];

    return queryResult;
  }

  async findOne<T>(
    entityClass: EntityClass<T>,
    { where, select }: MethodOptions<T>,
  ) {
    const { entityName, selectQuery, whereCondition } = this.commonSettings({
      entityClass,
      select,
      where,
    });

    try {
      const query = `${selectQuery} ${whereCondition} LIMIT 1 OFFSET  0`;
      console.log({ query, where });

      const queryResult = (await Promise.resolve(
        this.db.prepare(query).get(where),
      )) as T;

      return queryResult;
    } catch (error) {
      throw new Error(`Error while finding ${entityName}, Error : ${error}`);
    }
  }

  async update<T>(
    entityClass: EntityClass<T>,
    target: Partial<EntityClass<T>> | string | number,
    updateValue: Partial<EntityClass<T>>,
    selectValue: Partial<BooleanValue<T>>,
  ) {
    const { entityName } = this.commonSettings({
      entityClass,
      select: selectValue,
    });

    try {
      const updates = Object.keys(updateValue)
        .map((key) => `${key} = @set_${key}`)
        .join(", ");

      let whereClause = "";
      let whereParams: Record<any, any> = {};
      let setParams: Record<string, any> = {};

      Object.entries(updateValue).forEach(([key, value]) => {
        setParams[`set_${key}`] = value;
      });

      if (typeof target === "string" || typeof target === "number") {
        whereClause = `WHERE id = @id`;
        whereParams.id = target;
      } else {
        const updateKeys = Object.keys(updateValue);
        const conditions = Object.entries(target).map(([key, value]) => {
          if (!updateKeys.includes(key)) {
            whereParams[key] = value;
            return `${key} = @${key}`;
          }
          return null;
        });
        whereClause = `WHERE ${conditions.filter(Boolean).join(" AND ")}`;
      }

      const query = `UPDATE ${entityName} SET ${updates} ${whereClause}`;
      const params = { ...setParams, ...whereParams };

      const stmt = this.db.prepare(query);
      const result = this.db.transaction(() => {
        return stmt.run(params);
      })();
      console.log(`Rows updated: ${result.changes}`);

      return this.findOne(entityClass, {
        select: selectValue,
        where: whereParams as T,
      });
    } catch (error) {
      throw new Error(`Failed to update ${entityName}: ${error}`);
    }
  }

  private commonSettings<T>({
    entityClass,
    select,
    where,
  }: CommonSettingOpts<T>) {
    const entityName = entityClass.name.toLowerCase();
    const selection = this.findAnything(select);
    const selectQuery = `${selection} ${entityName}`;
    const whereCondition = this.whereCondition(entityClass, where);

    return {
      entityName,
      selection,
      selectQuery,
      whereCondition,
    };
  }

  private whereCondition<T>(entityClass: EntityClass<T>, where?: Partial<T>) {
    const entityName = entityClass.name.toLowerCase();
    try {
      const keys = Object.keys(where || {})
        .map((value) => {
          return `${entityName}.${value} = @${value}`;
        })
        .join(" AND ");

      return `${where ? `WHERE ${keys}` : ""} `;
    } catch (error) {
      throw new Error(`Failed while query ${entityName}: ${error}`);
    }
  }

  private findAnything<T>({ select }: SelectionOption<T> = {}) {
    if (!select) {
      return "SELECT * FROM ";
    }

    const propertyLength = Object.entries(select).length;
    // let selectCondition = "SELECT ";
    // Object.entries(select).map(([key, value], index) => {
    //   if (typeof value !== "object") {
    //     const comma = index < propertyLength - 1 ? ", " : "";
    //     selectCondition += `${this.entity}.${key} ${comma}`;
    //   }
    // });
  }

  disconnect() {
    if (this.db) {
      this.db.close();
      console.log("Disconnected from SQLite");
    }
  }
}
