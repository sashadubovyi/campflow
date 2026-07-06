import { Injectable, Logger } from '@nestjs/common';
import { GeoResolverService, type GeoPlace } from './geo-resolver.service';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';

export interface DraftPoll {
  kind: 'single_choice' | 'multi_choice' | 'location';
  question: string;
  options?: string[];
  geoQuery?: { area: string; category: string; limit: number };
  resolvedPlaces?: GeoPlace[];
}

export interface RoomDraft {
  room: { name: string; description: string | null; eventDate: string | null };
  polls: DraftPoll[];
}

interface ChecklistResult {
  categories: { name: string; items: string[] }[];
}

interface DuplicateResult {
  isDuplicate: boolean;
  similarTo: string | null;
  reason: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
    private readonly geo: GeoResolverService,
  ) {}

  /**
   * Генерує чек-лист речей за текстовим описом поїздки.
   * Відповідає мовою інтерфейсу користувача.
   */
  async generateRoomDraft(userId: string, prompt: string, locale: string): Promise<RoomDraft | null> {
    const lang = this.gemini.localeName(locale);

    const systemPrompt = `You are an event planning assistant. Analyze the user's request and decompose it into a room (event) and multiple polls.

User request: "${prompt}"

Rules:
- Decompose into SEPARATE independent polls for each decision
- For geographic decisions, do NOT invent coordinates — return geoQuery instead
- geoQuery.category must be one of: cinema, restaurant, bar, cafe, park, museum, hotel, theatre, club, sport
- eventDate must be ISO date string (YYYY-MM-DD) or null if not mentioned
- Return ONLY valid JSON, no markdown

Respond in this exact JSON format:
{
  "room": { "name": "string", "description": "string or null", "eventDate": "YYYY-MM-DD or null" },
  "polls": [
    { "kind": "single_choice", "question": "string", "options": ["opt1", "opt2"] },
    { "kind": "location", "question": "string", "geoQuery": { "area": "string", "category": "string", "limit": 5 } }
  ]
}

Write all text in ${lang} language.`;

    const draft = await this.gemini.generateJson<RoomDraft>(systemPrompt);
    if (!draft) return null;

    // Збагачуємо location-polls реальними координатами
    for (const poll of draft.polls) {
      if (poll.kind === 'location' && poll.geoQuery) {
        const places = await this.geo.resolve(
          poll.geoQuery.area,
          poll.geoQuery.category,
          poll.geoQuery.limit,
        );
        if (places.length > 0) {
          poll.resolvedPlaces = places;
        }
      }
    }

    await this.logInteraction(userId, 'room_draft', locale, prompt, draft);
    return draft;
  }

  async generateChecklist(userId: string, description: string, locale: string) {
    const lang = this.gemini.localeName(locale);

    const prompt = `You are a travel packing assistant. Based on this trip description, generate a packing checklist.
Trip description: "${description}"

Respond ONLY with valid JSON, no markdown, in this exact format:
{"categories":[{"name":"Category name","items":["item 1","item 2"]}]}

Rules:
- Write ALL category names and items in ${lang} language.
- 3 to 6 categories, 3 to 8 items each.
- Be practical and specific to the described trip.`;

    const result = await this.gemini.generateJson<ChecklistResult>(prompt);

    // Fallback, якщо ІІ недоступний
    const data: ChecklistResult =
      result && Array.isArray(result.categories) ? result : this.fallbackChecklist(locale);

    await this.logInteraction(userId, 'checklist', locale, description, data);

    return data;
  }

  /**
   * Перевіряє новий заголовок опитування на смисловий дублікат
   * серед уже наявних опитувань кімнати.
   */
  async checkDuplicate(userId: string, newTitle: string, existingTitles: string[], locale: string) {
    if (existingTitles.length === 0) {
      return { isDuplicate: false, similarTo: null, reason: '' };
    }

    const lang = this.gemini.localeName(locale);
    const prompt = `You are checking if a new poll is a semantic duplicate of existing polls.
New poll title: "${newTitle}"
Existing poll titles: ${JSON.stringify(existingTitles)}

Respond ONLY with valid JSON, no markdown:
{"isDuplicate":true/false,"similarTo":"exact existing title or null","reason":"short explanation"}

Write the "reason" field in ${lang} language. Consider polls duplicates if they ask essentially the same question.`;

    const result = await this.gemini.generateJson<DuplicateResult>(prompt);

    const data: DuplicateResult = result ?? {
      isDuplicate: false,
      similarTo: null,
      reason: '',
    };

    await this.logInteraction(userId, 'duplicate_check', locale, newTitle, data);

    return data;
  }

  /**
   * Генерує короткий підсумок події при закритті кімнати.
   * Використовується в room-lifecycle замість простої заглушки.
   */
  async summarizeRoom(
    roomName: string,
    participants: string[],
    planTitles: string[],
    locale: string,
  ): Promise<string> {
    const lang = this.gemini.localeName(locale);
    const prompt = `Write a short, warm 1-2 sentence memory summary of a completed group trip/event.
Event name: "${roomName}"
Participants: ${JSON.stringify(participants)}
Final plan highlights: ${JSON.stringify(planTitles)}

Write ONLY the summary text (no JSON, no quotes) in ${lang} language. Keep it warm and nostalgic, like a memory.`;

    const text = await this.gemini.generate(prompt);
    return text?.trim() || `Подія "${roomName}" завершена. Учасників: ${participants.length}.`;
  }

  private fallbackChecklist(locale: string): ChecklistResult {
    if (locale === 'en') {
      return {
        categories: [
          { name: 'Documents', items: ['Passport', 'Tickets', 'Insurance'] },
          { name: 'Clothing', items: ['Jacket', 'T-shirts', 'Comfortable shoes'] },
          { name: 'Essentials', items: ['Phone charger', 'Water bottle', 'First aid kit'] },
        ],
      };
    }
    if (locale === 'ru') {
      return {
        categories: [
          { name: 'Документы', items: ['Паспорт', 'Билеты', 'Страховка'] },
          { name: 'Одежда', items: ['Куртка', 'Футболки', 'Удобная обувь'] },
          { name: 'Необходимое', items: ['Зарядка', 'Бутылка воды', 'Аптечка'] },
        ],
      };
    }
    return {
      categories: [
        { name: 'Документи', items: ['Паспорт', 'Квитки', 'Страховка'] },
        { name: 'Одяг', items: ['Куртка', 'Футболки', 'Зручне взуття'] },
        { name: 'Необхідне', items: ['Зарядка', 'Пляшка води', 'Аптечка'] },
      ],
    };
  }

  private async logInteraction(
    userId: string,
    kind: string,
    locale: string,
    prompt: string,
    response: unknown,
  ) {
    try {
      await this.prisma.aiInteraction.create({
        data: {
          userId,
          kind,
          locale: locale as 'uk' | 'en' | 'ru',
          prompt,
          response: response as object,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to log AI interaction: ${(err as Error).message}`);
    }
  }
}
