import { useQuery } from '@tanstack/react-query';

import { getTicket } from '../api/tickets';
import { queryKeys } from './queryKeys';
import { useCurrentUser } from './useCurrentUser';

export function useTicket(ticketId) {
  const { currentUser } = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.ticket(currentUser.id, ticketId),
    queryFn: () => getTicket(ticketId),
  });
}
