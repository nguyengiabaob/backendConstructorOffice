import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";

import { JwtModule } from "@nestjs/jwt/dist/jwt.module";
import { ProjectController } from "../controllers/project.controller";
import { ProjectServices } from "../services/project.service";
import { PROJECT_SERVICE } from "../TokenServices/Project.Token";
@Module({
  controllers: [ProjectController],
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: "bao-it-key",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [
    {
      provide: PROJECT_SERVICE,
      useClass: ProjectServices,
    },
  ],
})
export class ProjectModule {}
