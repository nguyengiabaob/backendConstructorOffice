import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Injectable,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  CreateLanguageData,
  ILanguageService,
  SetTranslationsData,
} from "../IService/ILanguageService";
import { LANGUAGE_SERVICE } from "../TokenServices/Project.Token";
import { GuardMiddleware } from "../middlewares/guard.middleware";

@Controller("language")
@UseGuards(GuardMiddleware)
@Injectable()
export class LanguageController {
  constructor(
    @Inject(LANGUAGE_SERVICE) private languageService: ILanguageService,
  ) {}

  @Get()
  async getLanguages(@Query("companyId", ParseIntPipe) companyId: number) {
    return this.languageService.getLanguages(companyId);
  }

  @Post()
  async createLanguage(@Body() data: CreateLanguageData) {
    return this.languageService.createLanguage(data);
  }

  @Delete(":id")
  async deleteLanguage(@Param("id", ParseIntPipe) id: number) {
    return this.languageService.deleteLanguage(id);
  }

  @Get("translations")
  async getTranslations(
    @Query("companyId", ParseIntPipe) companyId: number,
    @Query("lang") lang: string,
  ) {
    return this.languageService.getTranslations(companyId, lang);
  }

  @Post("translations")
  async setTranslations(@Body() data: SetTranslationsData) {
    return this.languageService.setTranslations(data);
  }
}
