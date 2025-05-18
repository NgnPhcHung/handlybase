import { Injectable } from "../../core/decorators/injectable";
import { EntityManager } from "../../core/infra/entityManager";
import { LoginDto } from "../dtos/login.dto";
import { Users } from "../entities/schemas";

@Injectable()
export class UserService extends EntityManager<Users> {
  entityClass = Users;

  login(payload: LoginDto) {
    const res = this.findOne(payload);
    if (!res) {
      throw new Error("Username or password does not exist");
    }

    return true;
  }
}
