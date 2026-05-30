import { api } from './client';

export interface ChecklistItem {
  label: string;
}

export interface ChecklistResponse {
  items: ChecklistItem[];
  source: 'ai' | 'fallback';
}

export interface DuplicateCheckResponse {
  isDuplicate: boolean;
  similarTo: string | null;
  reason: string | null;
}

export const aiApi = {
  async generateChecklist(description: string, locale?: string): Promise<ChecklistResponse> {
    const { data } = await api.post<ChecklistResponse>('/ai/checklist', {
      description,
      locale,
    });
    return data;
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