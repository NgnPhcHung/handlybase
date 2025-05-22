export type AnyClass<T = any> = new (...args: any[]) => T;

export type EntityClass<T> = new () => T;
export type NoIdEntityClass<T> = Omit<EntityClass<T>, "id">;

export interface WhereOption<T> {
  where: Partial<T>;
}

export interface FindOneOption<T> {
  select: Partial<T>;
}
