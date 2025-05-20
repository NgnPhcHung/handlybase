import { Injectable } from "../../core/decorators/injectable";
import { EntityManager } from "../../core/infra/entityManager";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";
import { Users } from "../entities/schemas";

@Injectable()
export class UserService extends EntityManager<Users> {
  entityClass = Users;

  async login(payload: LoginDto) {
    const res = this.findOne({
      select: { id: true, username: true, email: true },
      where: payload,
    });
    if (!res) {
      throw new Error("Username or password does not exist");
    }

    return res;
  }

  register(payload: RegisterDto) {
    const res = this.findOne({
      where: {
        username: payload.username,
      },
    });
    if (res) {
      throw new Error("Username or password already exist");
    }
    const newEntity = this.create(payload);
    return newEntity;
  }

  changePassword(payload: { password: string }) {
    const user = this.findOne({ where: { id: 3 } });
    if (!user) {
      throw new Error("Username or password does not exist");
    }

    const res = this.update({
      entity: user,
      updateValue: { password: payload.password },
    });

    return res;
  }
}
