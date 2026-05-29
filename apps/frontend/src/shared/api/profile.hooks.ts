import { useQuery } from '@tanstack/react-query';
import { profileApi } from './profile.api';

export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => profileApi.getProfile(username),
    enabled: !!username && username.length >= 2,
  });
}
