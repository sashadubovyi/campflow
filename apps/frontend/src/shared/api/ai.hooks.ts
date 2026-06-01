import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { aiApi } from './ai.api';

export function useGenerateChecklist() {
  const { i18n } = useTranslation();
  return useMutation({
    mutationFn: (description: string) => aiApi.generateChecklist(description, i18n.language),
  });
}

export function useCheckDuplicate() {
  const { i18n } = useTranslation();
  return useMutation({
    mutationFn: ({ roomId, title }: { roomId: string; title: string }) =>
      aiApi.checkDuplicate(roomId, title, i18n.language),
  });
}
