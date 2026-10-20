import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { FILE_SERVICE } from "../TokenServices/Project.Token";
import { FileService } from "../services/File/File.Service";
import { FileController } from "../controllers/file.controller";

@Module({
  controllers: [FileController],
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: "bao-it-key",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [
    {
      provide: FILE_SERVICE,
      useClass: FileService,
    },
  ],
})
export class FileModule {}
