import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma.module";
import { AuthModule } from "./modules/authModule";
import { ProjectModule } from "./modules/projectModule";
import { TaskModule } from "./modules/taskModule";
import { FileModule } from "./modules/fileModule";
@Global()
@Module({
  imports: [PrismaModule, AuthModule, ProjectModule, TaskModule, FileModule],
})
export class AppModule {}
