import { api } from './client';

export interface ChecklistItem {
  label: string;
}

export interface ChecklistResponse {
  items: ChecklistItem[];
  source: 'ai' | 'fallback';
}

interface RawChecklistResponse {
  categories?: Array<{
    name: string;
    items: string[];
  }>;
  items?: Array<{ label: string } | string>;
  source?: 'ai' | 'fallback';
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  similarTo: string | null;
  reason: string | null;
}

/**
 * Нормалізує відповідь бекенду до плоского списку.
 * Бекенд повертає {categories: [{name, items: string[]}]} —
 * розгортаємо у один масив з префіксами категорій для UI.
 */
function flattenChecklist(raw: RawChecklistResponse): ChecklistResponse {
  // Плоский варіант (якщо колись бекенд почне віддавати плоский)
  if (raw.items && Array.isArray(raw.items)) {
    return {
      items: raw.items.map((it) => (typeof it === 'string' ? { label: it } : { label: it.label })),
      source: raw.source ?? 'ai',
    };
  }

  // Категорійний варіант — розплющуємо у плоский
  if (raw.categories && Array.isArray(raw.categories)) {
    const items: ChecklistItem[] = [];
    for (const cat of raw.categories) {
      for (const it of cat.items) {
        items.push({ label: it });
      }
    }
    return {
      items,
      source: raw.source ?? 'ai',
    };
  }

  return { items: [], source: 'fallback' };
}

export const aiApi = {
  async generateChecklist(description: string, locale?: string): Promise<ChecklistResponse> {
    const { data } = await api.post<RawChecklistResponse>('/ai/checklist', {
      description,
      locale,
    });
    return flattenChecklist(data);
  },

  async checkDuplicate(
    roomId: string,
    title: string,
    locale?: string,
  ): Promise<DuplicateCheckResponse> {
    const { data } = await api.post<DuplicateCheckResponse>('/ai/check-duplicate', {
      roomId,
      title,
      locale,
    });
    return data;
  },
};
