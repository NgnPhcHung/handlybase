import { EntityClass } from "../types";

export abstract class DatabaseClient {
  abstract connect(): Promise<void>;
  abstract query<T>(
    entity: EntityClass<T>,
    sql: string,
    params?: any[],
  ): Promise<T>;
}

export abstract class DatabaseMethods {
  abstract find<T>(opts: MethodOptions<T>): Promise<T[] | []>;
}

interface MethodOptions<T> extends SelectionOption<T>, FindOneOptions<T> {}

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
type BooleanValue<T> = {
  [K in keyof T]: T[K] extends object ? BooleanValue<T[K]> : boolean;
};
