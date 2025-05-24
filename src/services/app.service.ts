import { SchemaRootDto } from "../dtos/schema.dto";
import { BaseRepository } from "../../core/databases/baseRepository";
import { DatabaseClient } from "../../core/databases/databaseClient";
import { Injectable } from "../../core/decorators";
import { interfaceHanlders, SqlMapper } from "../../core/parser";
import { AnyClass } from "../../core";

@Injectable()
export class AppService extends BaseRepository<AnyClass> {
  constructor(db: DatabaseClient) {
    super({} as AnyClass);
  }

  async importSchema(payload: SchemaRootDto) {
    try {
      const mapper = new SqlMapper(payload);
      const { query } = mapper.createTableQuery();

      for await (const q of query) {
        await this.execute(q.trim());
      }

      let content = "";
      for (const collection of payload.collections) {
        const handler = interfaceHanlders(collection.name);
        for (const field of collection.fields) {
          handler.toPropety(field);
        }
        content += "\n" + handler.values();
      }
      await interfaceHanlders("").toInterfaceFile(
        "./handly/",
        "schemas.ts",
        content,
      );
    } catch (error) {
      throw error;
    }
  }
}
