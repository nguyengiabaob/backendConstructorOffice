import { Module, Global } from "@nestjs/common";
import { PrismaService } from "../../shared/Database/prisma.service";
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
