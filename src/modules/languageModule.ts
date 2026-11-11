import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { LANGUAGE_SERVICE } from "../TokenServices/Project.Token";
import { LanguageService } from "../services/Language/Language.Service";
import { LanguageController } from "../controllers/language.controller";

@Module({
  controllers: [LanguageController],
  imports: [PrismaModule],
  providers: [
    {
      provide: LANGUAGE_SERVICE,
      useClass: LanguageService,
    },
  ],
  exports: [LANGUAGE_SERVICE],
})
export class LanguageModule {}
