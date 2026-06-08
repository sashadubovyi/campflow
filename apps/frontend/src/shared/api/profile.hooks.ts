import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi, type UpdateProfilePayload, type UserSearchBy } from './profile.api';
import { useAuthStore } from '../store/auth.store';

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
      qc.invalidateQueries({ queryKey: ['profile', data.username] });
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (data) => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({ ...currentUser, avatarUrl: data.avatarUrl });
      }
      qc.invalidateQueries({ queryKey: ['myProfile'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useUploadProfileCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => profileApi.uploadCover(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myProfile'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSearchUsers(q: string, by: UserSearchBy = 'auto') {
  return useQuery({
    queryKey: ['users', 'search', by, q],
    queryFn: () => profileApi.search(q, by),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });
}
