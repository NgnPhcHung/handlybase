import { Controller } from "../../core/decorators/controller";
import { Post, Put } from "../../core/decorators/methodDecorator";
import { Body } from "../../core/decorators/paramsDecorator";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";
import { BaseService } from "../services/base.service";
import { UserService } from "../services/user.service";

@Controller("/users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly tempSerivce: BaseService,
  ) {}

  @Post("/login")
  login(@Body() payload: LoginDto) {
    this.tempSerivce.find({ createdAt: "" });

    // return this.userService.login(payload);
  }

  @Post("/register")
  register(@Body() payload: RegisterDto) {
    return this.userService.register(payload);
  }

  @Put("/change-password")
  changePassword(@Body() payload: { password: string }) {
    return this.userService.changePassword(payload);
  }
}
