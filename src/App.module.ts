import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "./modules/prisma.module";
import { AuthModule } from "./modules/authModule";
@Global()
@Module({
  imports: [PrismaModule, AuthModule],
})
export class AppModule {}
