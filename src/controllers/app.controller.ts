import { Controller } from "../../core/decorators/controller";
import { Post } from "../../core/decorators/methodDecorator";
import { Body } from "../../core/decorators/paramsDecorator";
import { SchemaRootDto } from "../dtos/schema.dto";
import { AppService } from "../services/app.service";
import { UserController } from "./user.controller";

@Controller({
  path: "/app",
  children: [UserController],
})
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post("/import-schema")
  async importSchema(@Body() body: SchemaRootDto) {
    this.appService.handleSchemaImport(body);
    return true;
  }
}
