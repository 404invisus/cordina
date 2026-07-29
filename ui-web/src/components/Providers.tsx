'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'var(--font-sans)',
            background: '#0d2b48',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: '500',
            borderRadius: '6px',
            padding: '12px 16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#137a52', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#b3261e', secondary: '#ffffff' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
