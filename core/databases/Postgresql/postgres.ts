import { Pool } from "pg";
import { EntityClass, NoIdEntityClass } from "../../types";
import {
  BooleanValue,
  DatabaseClient,
  MethodOptions,
  SelectionOption,
} from "../databaseClient";
import { PostgresConfig } from "../databaseConfig";

interface CommonSettingOpts<T> extends MethodOptions<T> {
  entityClass: EntityClass<T>;
}

export class PostgresClient extends DatabaseClient {
  private static instance: PostgresClient;
  private pool!: Pool;

  constructor(private dbConfig: PostgresConfig) {
    super();
  }

  static getInstance(config: PostgresConfig): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient(config);
    }
    return PostgresClient.instance;
  }

  async connect() {
    const {
      config: { connectionString },
    } = this.dbConfig;

    this.pool = new Pool({ connectionString });

    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1");
      console.log("Connected to PostgreSQL!!!");
      client.release();
    } catch (error) {
      throw new Error(
        "Database connection string is incorrect or connection failed.",
      );
    }
  }

  async query<T = any>(sql: string): Promise<T> {
    const result = await this.pool.query(sql);
    return result.rows as T;
  }

  async execute(sql: string) {
    try {
      console.log(sql);
      await this.pool.query(sql.trim());
    } catch (error) {
      throw new Error(`Failed to execute query: ${error}`);
    }
  }

  async find<T>(
    entityClass: EntityClass<T>,
    { where, select }: MethodOptions<T>,
  ): Promise<T[]> {
    const { selectQuery, whereCondition, params } = this.commonSettings({
      entityClass,
      select,
      where,
    });

    const query = `${selectQuery} ${whereCondition}`;
    const result = await this.pool.query(query, Object.values(params));

    return result.rows as T[];
  }

  async findOne<T>(
    entityClass: EntityClass<T>,
    { where, select }: MethodOptions<T>,
  ) {
    const { entityName, selectQuery, whereCondition, params } =
      this.commonSettings({ entityClass, select, where });

    try {
      const query = `${selectQuery} ${whereCondition} LIMIT 1`;
      const result = await this.pool.query(query, Object.values(params));

      return result.rows[0] as T;
    } catch (error) {
      throw new Error(`Error while finding ${entityName}: ${error}`);
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

    const setKeys = Object.keys(updateValue);
    const setClause = setKeys
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(", ");

    const setValues = Object.values(updateValue);

    let whereClause = "";
    let whereValues: any[] = [];

    if (typeof target === "string" || typeof target === "number") {
      whereClause = `WHERE id = $${setKeys.length + 1}`;
      whereValues = [target];
    } else {
      const entries = Object.entries(target);
      whereClause =
        "WHERE " +
        entries
          .map(([key], idx) => `${key} = $${setKeys.length + idx + 1}`)
          .join(" AND ");
      whereValues = entries.map(([, v]) => v);
    }

    const query = `UPDATE ${entityName} SET ${setClause} ${whereClause}`;
    const allValues = [...setValues, ...whereValues];

    try {
      const result = await this.pool.query(query, allValues);
      console.log(`Rows updated: ${result.rowCount}`);

      const whereObj =
        typeof target === "object"
          ? (target as T)
          : ({ id: target } as unknown as T);

      return this.findOne(entityClass, {
        select: selectValue,
        where: whereObj,
      });
    } catch (error) {
      throw new Error(`Failed to update ${entityName}: ${error}`);
    }
  }

  async create<T>(
    entityClass: EntityClass<T>,
    data: NoIdEntityClass<T>,
  ): Promise<T> {
    const { entityName } = this.commonSettings({ entityClass });

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, idx) => `$${idx + 1}`).join(", ");

    const query = `INSERT INTO ${entityName} (${keys.join(
      ", ",
    )}) VALUES (${placeholders}) RETURNING *`;

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0] as T;
    } catch (error) {
      throw new Error(`Failed to save ${entityName}: ${error}`);
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
    const { condition, params } = this.whereCondition(entityClass, where);

    return {
      entityName,
      selection,
      selectQuery,
      whereCondition: condition,
      params,
    };
  }

  private whereCondition<T>(
    entityClass: EntityClass<T>,
    where?: Partial<T>,
  ): { condition: string; params: Record<string, any> } {
    const entityName = entityClass.name.toLowerCase();
    const params: Record<string, any> = {};
    if (!where) return { condition: "", params };

    const keys = Object.keys(where);
    const conditions = keys.map((key, idx) => {
      params[key] = where[key as keyof T];
      return `${entityName}.${key} = $${idx + 1}`;
    });

    return {
      condition: `WHERE ${conditions.join(" AND ")}`,
      params,
    };
  }

  private findAnything<T>({ select }: SelectionOption<T> = {}) {
    return `SELECT ${select ? Object.keys(select).join(", ") : "*"} FROM`;
  }

  disconnect() {
    if (this.pool) {
      this.pool.end();
      console.log("Disconnected from PostgreSQL");
    }
  }
}
