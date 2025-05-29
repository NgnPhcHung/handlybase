import { Controller, Post, Body, Put } from "../../core/decorators";
import { LoginDto } from "../dtos/login.dto";
import { RegisterDto } from "../dtos/register.dto";
import { PostService } from "../services/post.service";
import { UserService } from "../services/user.service";

@Controller("/users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly postService: PostService,
  ) {}

  @Post("/login")
  login(@Body() payload: LoginDto) {
    return this.userService.login(payload);
  }

  @Post("/register")
  register(@Body() payload: RegisterDto) {
    return this.userService.register(payload);
  }

  @Put("/change-password")
  changePassword(@Body() payload: { password: string }) {
    return this.userService.changePassword(payload);
  }

  @Post("/create-post")
  createPost(@Body() payload: any) {
    return this.postService.createPost(payload);
  }
}
