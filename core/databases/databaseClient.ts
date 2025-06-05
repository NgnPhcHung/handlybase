import { EntityClass, NoIdEntityClass } from "../types";

export abstract class DatabaseClient implements DatabaseMethods {
  /**
   * @Description Use to create an entity and return created entity
   */
  abstract create<T>(
    entityClass: EntityClass<T>,
    data: NoIdEntityClass<T>,
  ): Promise<T>;

  /**
   * @Description Use to find an data from entity which return an object
   */
  abstract findOne<T>(
    entityClass: EntityClass<T>,
    opts?: MethodOptions<T>,
  ): Promise<T | null>;

  /**
   * @Description Use to find an data from entity which return an array
   */
  abstract find<T>(
    entityClass: EntityClass<T>,
    opts?: MethodOptions<T>,
  ): Promise<T[] | []>;

  /**
   * @Description Use to update an entity and return updated entity
   */
  abstract update<T>(
    entityClass: EntityClass<T>,
    target: Partial<EntityClass<T>> | string | number,
    updateValue: Partial<EntityClass<T>>,
    selectValue?: Partial<BooleanValue<T>>,
  ): Promise<T | null>;

  /**
   * @Description Use for execute query that return something
   */
  abstract query<T>(sql: string): Promise<T>;

  /**
   * @Description  Use for execute query which does not return anything
   */
  abstract execute(raw: string): Promise<void>;

  abstract connect(): Promise<void>;
}

abstract class DatabaseMethods {
  abstract find<T>(
    entity: EntityClass<T>,
    opts?: MethodOptions<T>,
  ): Promise<T[] | []>;

  abstract findOne<T>(
    entity: EntityClass<T>,
    opts?: MethodOptions<T>,
  ): Promise<T | null>;

  abstract update<T>(
    entity: EntityClass<T>,
    target: Partial<EntityClass<T>> | string | number,
    updateValue: Partial<EntityClass<T>>,
    selectValue: Partial<BooleanValue<T>>,
  ): Promise<T | null>;

  abstract create<T>(
    entity: EntityClass<T>,
    data: NoIdEntityClass<T>,
  ): Promise<T | null>;

  abstract execute(raw: string): Promise<void>;
  abstract query<T>(raw: string): Promise<T>;
}

export interface MethodOptions<T> extends SelectionOption<T>, WhereOption<T> {}

export interface WhereOption<T> {
  where?: Partial<T>;
}
export interface SelectionOption<T> {
  select?: Partial<BooleanValue<T>>;
}

export interface UpdateOptions<T> extends SelectionOption<T> {
  entity: T | string | number;
  updateValue: Partial<T>;
}
export type BooleanValue<T> = {
  [K in keyof T]: T[K] extends object ? BooleanValue<T[K]> : boolean;
};
