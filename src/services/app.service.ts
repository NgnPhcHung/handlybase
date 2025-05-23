import { Injectable } from "@decorators";
import { SchemaRootDto } from "../dtos/schema.dto";
import { Users } from "../entities/schemas";
import { SqlMapper } from "@parser";
import { BaseRepository } from "../../core/databases/baseRepository";
import { DatabaseClient } from "../../core/databases/databaseClient";

@Injectable()
export class AppService extends BaseRepository<Users> {
  constructor(db: DatabaseClient) {
    super(Users);
  }

  async handleSchemaImport(payload: SchemaRootDto) {
    try {
      const mapper = new SqlMapper(payload);
      const { autoFunction, query } = mapper.createTableQuery();
      await Promise.all([
        await this.execute(query.trim()),
        await this.execute(autoFunction.trim()),
      ]);
    } catch (error) {
      throw error;
    }
  }
}
