import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { CurrentUserContext } from '../context/CurrentUserContext';
import { ToastProvider } from '../context/ToastProvider';
import theme from '../theme/theme';
import { users } from './fixtures';

/**
 * Renders `ui` with the same providers as the app, but with a fixed acting user instead of
 * the real CurrentUserProvider (which would fetch /api/users/) and no query retries.
 */
export function renderWithProviders(ui, { user = users.client } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const currentUser = { currentUser: user, users: Object.values(users), switchUser: () => {} };

  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ToastProvider>
            <CurrentUserContext.Provider value={currentUser}>{ui}</CurrentUserContext.Provider>
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}
