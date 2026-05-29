import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from './contacts.api';

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsApi.list(),
  });
}

export function useAddContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => contactsApi.add(contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useRemoveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => contactsApi.remove(contactId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
