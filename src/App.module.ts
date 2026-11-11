import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma.module";
import { AuthModule } from "./modules/authModule";
import { ProjectModule } from "./modules/projectModule";
import { TaskModule } from "./modules/taskModule";
import { FileModule } from "./modules/fileModule";
import { LanguageModule } from "./modules/languageModule";
@Global()
@Module({
  imports: [PrismaModule, AuthModule, ProjectModule, TaskModule, FileModule, LanguageModule],
})
export class AppModule {}
