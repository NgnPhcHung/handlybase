import { AnyClass } from "../../core";
import { BaseRepository } from "../../core/databases/baseRepository";
import { DatabaseClient } from "../../core/databases/databaseClient";
import { Injectable } from "../../core/decorators";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";

@Injectable()
export class UserService extends BaseRepository<AnyClass> {
  constructor(db: DatabaseClient) {
    super({} as AnyClass);
  }

  async login(payload: LoginDto) {
    const res = await this.findOne({
      where: {
        ...payload,
      },
      select: {
        id: true,
      },
    });

    if (!res) {
      throw new Error("Username or password does not exist");
    }

    return res;
  }

  async changePassword(payload: { password: string }) {
    const user = await this.findOne({ where: { id: 1 } });
    if (!user) {
      throw new Error("Username or password does not exist");
    }

    const res = await this.update(1, {
      password: payload.password,
    });

    return res;
  }

  async register(payload: RegisterDto) {
    const res = await this.findOne({
      where: {
        username: payload.username,
      },
    });
    if (res) {
      throw new Error("Username or password already exist");
    }
    const newEntity = await this.create(payload);
    return newEntity;
  }

  // entityClass = Users;
  //
  // async login(payload: LoginDto) {
  //   const res = this.findOne({
  //     select: { id: true, username: true, email: true },
  //     where: payload,
  //   });
  //   if (!res) {
  //     throw new Error("Username or password does not exist");
  //   }
  //
  //   return res;
  // }
  //
  // register(payload: RegisterDto) {
  //   const res = this.findOne({
  //     where: {
  //       username: payload.username,
  //     },
  //   });
  //   if (res) {
  //     throw new Error("Username or password already exist");
  //   }
  //   const newEntity = this.create(payload);
  //   return newEntity;
  // }
  //
  // changePassword(payload: { password: string }) {
  //   const user = this.findOne({ where: { id: 3 } });
  //   if (!user) {
  //     throw new Error("Username or password does not exist");
  //   }
  //
  //   const res = this.update({
  //     entity: user,
  //     updateValue: { password: payload.password },
  //   });
  //
  //   return res;
  // }
}
