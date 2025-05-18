import { Controller } from "../../core/decorators/controller";
import { Post } from "../../core/decorators/methodDecorator";
import { Body } from "../../core/decorators/paramsDecorator";
import { LoginDto } from "../dtos/login.dto";
import { UserService } from "../services/user.service";

@Controller("/users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post("/login")
  getAll(@Body() payload: LoginDto) {
    return this.userService.login(payload);
  }
}
