import { useQuery } from '@tanstack/react-query';

import { getAssignableTechnicians } from '../api/tickets';
import { queryKeys } from './queryKeys';
import { useCurrentUser } from './useCurrentUser';

export function useAssignableTechnicians(ticketId) {
  const { currentUser } = useCurrentUser();
  return useQuery({
    queryKey: queryKeys.assignableTechnicians(currentUser.id, ticketId),
    queryFn: () => getAssignableTechnicians(ticketId),
  });
}
