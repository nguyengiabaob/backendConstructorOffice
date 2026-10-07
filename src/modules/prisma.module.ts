import { Module, Global } from "@nestjs/common";
import { PrismaService } from "../../shared/Database/prisma.service";
import { PrismaExecutorService } from "../services/prisma-executor.service";
@Global()
@Module({
  providers: [PrismaService, PrismaExecutorService],
  exports: [PrismaService, PrismaExecutorService],
})
export class PrismaModule {}
