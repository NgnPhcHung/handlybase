import { BaseRepository, DatabaseClient, Injectable } from "@core";
import { Users } from "handly/schemas";
import { LoginDto } from "src/dtos/login.dto";
import { RegisterDto } from "src/dtos/register.dto";

@Injectable()
export class UserService extends BaseRepository<Users> {
  constructor(db: DatabaseClient) {
    super(Users);
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
}
