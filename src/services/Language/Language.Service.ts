import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../shared/Database/prisma.service";
import {
  CreateLanguageData,
  ILanguageService,
  LanguageData,
  SetTranslationsData,
} from "../../IService/ILanguageService";

@Injectable()
export class LanguageService implements ILanguageService {
  constructor(private prisma: PrismaService) {}

  private id(value: number): number {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new BadRequestException("IDs must be positive integers");
    }
    return value;
  }

  private toLanguageData(item: any): LanguageData {
    return {
      id: item.id,
      companyId: item.companyId,
      code: item.code,
      name: item.name,
      isDefault: Boolean(item.isDefault),
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
    };
  }

  async getLanguages(companyId: number): Promise<LanguageData[]> {
    const list = await (this.prisma as any).language.findMany({
      where: { companyId: this.id(companyId) },
      orderBy: [{ isDefault: "desc" }, { id: "asc" }],
    });
    return list.map((item: any) => this.toLanguageData(item));
  }

  async createLanguage(data: CreateLanguageData): Promise<LanguageData> {
    const companyId = this.id(data?.companyId);
    const code = data?.code?.trim().toLowerCase();
    const name = data?.name?.trim();
    if (!code || code.length > 10) throw new BadRequestException("Code must contain 1 to 10 characters");
    if (!name || name.length > 100) throw new BadRequestException("Name must contain 1 to 100 characters");
    const isDefault = Boolean(data.isDefault);

    return (this.prisma as any).$transaction(async (db: any) => {
      if (isDefault) {
        await db.language.updateMany({ where: { companyId }, data: { isDefault: false } });
      }
      const existing = await db.language.findFirst({ where: { companyId, code } });
      const record = existing
        ? await db.language.update({ where: { id: existing.id }, data: { name, isDefault } })
        : await db.language.create({ data: { companyId, code, name, isDefault } });
      return this.toLanguageData(record);
    });
  }

  async deleteLanguage(id: number): Promise<void> {
    const target = await (this.prisma as any).language.findUnique({ where: { id: this.id(id) } });
    if (!target) throw new NotFoundException("Language not found");
    await (this.prisma as any).language.delete({ where: { id: target.id } });
  }

  async getTranslations(companyId: number, lang: string): Promise<Record<string, string>> {
    const code = lang?.trim().toLowerCase();
    if (!code) throw new BadRequestException("Language code is required");
    const list = await (this.prisma as any).translation.findMany({
      where: { companyId: this.id(companyId), lang: code },
    });
    return list.reduce((acc: Record<string, string>, item: any) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  }

  async setTranslations(data: SetTranslationsData): Promise<{ count: number }> {
    const companyId = this.id(data?.companyId);
    const lang = data?.lang?.trim().toLowerCase();
    if (!lang) throw new BadRequestException("Language code is required");
    if (!data?.translations || typeof data.translations !== "object") {
      throw new BadRequestException("Translations object is required");
    }

    const entries = Object.entries(data.translations);
    await (this.prisma as any).$transaction(async (db: any) => {
      for (const [key, value] of entries) {
        const k = key.trim();
        if (!k) continue;
        const v = String(value ?? "");
        const existing = await db.translation.findFirst({ where: { companyId, lang, key: k } });
        if (existing) {
          await db.translation.update({ where: { id: existing.id }, data: { value: v } });
        } else {
          await db.translation.create({ data: { companyId, lang, key: k, value: v } });
        }
      }
    });

    return { count: entries.length };
  }
}
