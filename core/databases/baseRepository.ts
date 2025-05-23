import { container } from "../startApp";
import { EntityClass, NoIdEntityClass } from "../types";
import { BooleanValue, DatabaseClient, MethodOptions } from "./databaseClient";

export class BaseRepository<T> {
  private db!: DatabaseClient;

  constructor(protected readonly entityClass: EntityClass<T>) {
    this.db = container.resolve(DatabaseClient);
  }

  get getDb() {
    return this.db;
  }

  async execute(raw: string): Promise<any> {
    return this.db.execute(raw);
  }

  async find(opts: MethodOptions<T>): Promise<T[] | []> {
    return this.db.find<T>(this.entityClass, opts);
  }

  async findOne(opts: MethodOptions<T>): Promise<T | null> {
    return this.db.findOne<T>(this.entityClass, opts);
  }

  async update(
    target: Partial<EntityClass<T>> | string | number,
    updateValue: Partial<EntityClass<T>>,
    selectValue?: Partial<BooleanValue<T>>,
  ): Promise<T | null> {
    return this.db.update<T>(
      this.entityClass,
      target,
      updateValue,
      selectValue,
    );
  }

  async create(data: NoIdEntityClass<T>): Promise<T> {
    return this.db.create(this.entityClass, data);
  }

  async persist<T>(entity: T): Promise<void> {}
}
