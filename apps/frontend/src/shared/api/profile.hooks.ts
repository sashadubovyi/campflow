import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi, type UpdateProfilePayload } from './profile.api';

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => profileApi.getProfile(username),
    enabled: !!username && username.length >= 2,
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: () => profileApi.getMyProfile(),
  });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileApi.updateMyProfile(payload),
    onSuccess: (data) => {
      qc.setQueryData(['myProfile'], data);
      // інвалідуємо публічний профіль теж, щоб одразу побачити зміни на /u/:username
      qc.invalidateQueries({ queryKey: ['profile', data.username] });
    },
  });
}
