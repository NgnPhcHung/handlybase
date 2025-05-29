import { BaseRepository } from "../../core/databases/baseRepository";
import { DatabaseClient } from "../../core/databases/databaseClient";
import { Injectable } from "../../core/decorators";
import { Posts } from "../../handly/schemas";

@Injectable()
export class PostService extends BaseRepository<Posts> {
  constructor(db: DatabaseClient) {
    super(Posts);
  }

  async createPost(payload: any) {
    return this.create(payload);
  }
}
