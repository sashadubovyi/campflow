import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { useAuth } from './shared/store/useAuth';
import { useNotificationsSubscription } from './shared/api/notifications.hooks';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { bootstrap, isInitialized } = useAuth();

  useNotificationsSubscription();

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-forest-50 flex items-center justify-center">
        <div className="font-display text-2xl text-forest-900 animate-pulse">
          Camp<span className="text-ember-500">Flow</span>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}
