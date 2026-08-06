import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma.module";
import { AuthModule } from "./modules/authModule";
import { ProjectModule } from "./modules/projectModule";
@Global()
@Module({
  imports: [PrismaModule, AuthModule, ProjectModule],
})
export class AppModule {}
