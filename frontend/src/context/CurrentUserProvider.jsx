import { Box, CircularProgress } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { setActingUserId } from '../api/client';
import { ErrorState } from '../components/common/ErrorState';
import { useUsers } from '../hooks/useUsers';
import { paths } from '../utils/paths';
import { CurrentUserContext } from './CurrentUserContext';

const STORAGE_KEY = 'helpdesk.currentUserId';

function readStoredUserId() {
  const stored = Number.parseInt(localStorage.getItem(STORAGE_KEY) ?? '', 10);
  return Number.isInteger(stored) ? stored : null;
}

/**
 * Holds the demo "Viewing as" user. The rest of the app only renders once that user is
 * known, so every API call is guaranteed to carry a valid X-User-Id header.
 */
export function CurrentUserProvider({ children }) {
  const usersQuery = useUsers();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [userId, setUserId] = useState(readStoredUserId);

  // The header is set *before* React re-renders with the new user, never after.
  const selectUser = useCallback((id) => {
    setActingUserId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
    setUserId(id);
  }, []);

  const users = usersQuery.data;
  const currentUser = users?.find((user) => user.id === userId) ?? null;

  // First visit, or the stored user no longer exists (e.g. DB re-seeded): pick the first user.
  useEffect(() => {
    if (users?.length && !currentUser) selectUser(users[0].id);
  }, [users, currentUser, selectUser]);

  // Applies the id restored from localStorage (children only mount after the users request
  // resolves, so this has run by then). On every user change the cleanup forgets everything
  // cached for the previous user.
  useEffect(() => {
    if (userId == null) return undefined;
    setActingUserId(userId);
    return () => queryClient.removeQueries({ predicate: (q) => q.queryKey[1] === userId });
  }, [userId, queryClient]);

  const switchUser = useCallback(
    (id) => {
      selectUser(id);
      navigate(paths.tickets); // default tab/filters, no selected ticket
    },
    [selectUser, navigate],
  );

  const value = useMemo(
    () => ({ currentUser, users: users ?? [], switchUser }),
    [currentUser, users, switchUser],
  );

  if (usersQuery.isError) {
    return (
      <Box sx={{ maxWidth: 520, mx: 'auto', mt: 10, px: 2 }}>
        <ErrorState
          title="Couldn't load demo users"
          message={`${usersQuery.error.message} Is the API running on port 8000?`}
          onRetry={usersQuery.refetch}
        />
      </Box>
    );
  }
  if (!currentUser) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <CircularProgress aria-label="Loading" />
      </Box>
    );
  }
  return <CurrentUserContext.Provider value={value}>{children}</CurrentUserContext.Provider>;
}

CurrentUserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
