import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { useAuth } from './shared/store/useAuth';
import { useNotificationsSubscription } from './shared/api/notifications.hooks';
import { queryClient } from './shared/api/queryClient';
import { AppPreloader } from './shared/ui/AppPreloader';

function AppContent() {
  const { bootstrap } = useAuth();

  useNotificationsSubscription();

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppPreloader>
      <RouterProvider router={router} />
    </AppPreloader>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
