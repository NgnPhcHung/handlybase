import { Controller, Post, Body } from "@decorators";
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
    return this.appService.handleSchemaImport(body);
  }
}
