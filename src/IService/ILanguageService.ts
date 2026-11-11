export interface LanguageData {
  id: number;
  companyId: number;
  code: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLanguageData {
  companyId: number;
  code: string;
  name: string;
  isDefault?: boolean;
}

export interface SetTranslationsData {
  companyId: number;
  lang: string;
  translations: Record<string, string>;
}

export interface ILanguageService {
  getLanguages(companyId: number): Promise<LanguageData[]>;
  createLanguage(data: CreateLanguageData): Promise<LanguageData>;
  deleteLanguage(id: number): Promise<void>;
  getTranslations(companyId: number, lang: string): Promise<Record<string, string>>;
  setTranslations(data: SetTranslationsData): Promise<{ count: number }>;
}
