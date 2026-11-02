import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { createQueryClient } from './api/queryClient';
import { AppHeader } from './components/layout/AppHeader';
import { PageContainer } from './components/layout/PageContainer';
import { CurrentUserProvider } from './context/CurrentUserProvider';
import { ToastProvider } from './context/ToastProvider';
import { AppRoutes } from './routes';
import theme from './theme/theme';

export default function App() {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider theme={theme} defaultMode="system" noSsr disableTransitionOnChange>
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ToastProvider>
            <CurrentUserProvider>
              <AppHeader />
              <PageContainer>
                <AppRoutes />
              </PageContainer>
            </CurrentUserProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
