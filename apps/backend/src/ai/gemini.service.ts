import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const LOCALE_NAMES: Record<string, string> = {
  uk: 'Ukrainian',
  en: 'English',
  ru: 'Russian',
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private model: GenerativeModel | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey && apiKey.length > 10) {
      const genAI = new GoogleGenerativeAI(apiKey);
      this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.logger.log('Gemini initialized');
    } else {
      this.logger.warn('GEMINI_API_KEY not set — AI features will use fallbacks');
    }
  }

  get isAvailable(): boolean {
    return this.model !== null;
  }

  localeName(locale: string): string {
    return LOCALE_NAMES[locale] ?? 'Ukrainian';
  }

  /**
   * Базовий виклик: повертає текст або null при будь-якій помилці/відсутності ключа.
   * НІКОЛИ не кидає виняток — AI не повинен ламати застосунок.
   */
  async generate(prompt: string): Promise<string | null> {
    if (!this.model) return null;
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      this.logger.error(`Gemini error: ${(err as Error).message}`);
      return null;
    }
  }

  /**
   * Виклик з очікуванням JSON. Зрізає markdown-огорожі ```json ... ```
   * і безпечно парсить. Повертає null при невдачі.
   */
  async generateJson<T>(prompt: string): Promise<T | null> {
    const raw = await this.generate(prompt);
    if (!raw) return null;
    try {
      const cleaned = raw
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleaned) as T;
    } catch (err) {
      this.logger.error(`Gemini JSON parse error: ${(err as Error).message}`);
      return null;
    }
  }
}
