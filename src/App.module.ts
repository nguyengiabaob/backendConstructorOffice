import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma.module";
import { AuthModule } from "./modules/authModule";
import { ProjectModule } from "./modules/projectModule";
import { TaskModule } from "./modules/taskModule";
@Global()
@Module({
  imports: [PrismaModule, AuthModule, ProjectModule, TaskModule],
})
export class AppModule {}
