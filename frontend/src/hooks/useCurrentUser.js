import { useContext } from 'react';

import { CurrentUserContext } from '../context/CurrentUserContext';

/** `{ currentUser, users, switchUser(id) }` */
export function useCurrentUser() {
  const value = useContext(CurrentUserContext);
  if (!value) throw new Error('useCurrentUser must be used inside <CurrentUserProvider>.');
  return value;
}
