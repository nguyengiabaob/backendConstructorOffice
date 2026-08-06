import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";

import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { ProjectController } from "../controllers/project.controller";
import { ProjectServices } from "../services/project.service";

@Module({
  controllers: [ProjectController],
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: "bao-it-key",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [ProjectServices],
})
export class ProjectModule {}
