import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { listTickets } from '../api/tickets';
import { PAGE_SIZE } from '../utils/constants';
import { queryKeys } from './queryKeys';
import { useCurrentUser } from './useCurrentUser';

/**
 * Paginated ticket list for the acting user.
 *
 * While the next page loads, the previous page stays on screen (`placeholderData`), but only
 * if it belongs to the same user. If the requested page no longer exists (e.g. tickets were
 * resolved and the list shrank) the API answers 404 and `onPageOutOfRange` is called.
 */
export function useTickets(params, onPageOutOfRange) {
  const { currentUser } = useCurrentUser();
  const userId = currentUser.id;

  const query = useQuery({
    queryKey: queryKeys.ticketList(userId, params),
    queryFn: () => listTickets({ ...params, page_size: PAGE_SIZE }),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === userId ? previousData : undefined,
  });

  const pageOutOfRange = query.error?.status === 404 && params.page > 1;
  useEffect(() => {
    if (pageOutOfRange) onPageOutOfRange();
  }, [pageOutOfRange, onPageOutOfRange]);

  return query;
}
