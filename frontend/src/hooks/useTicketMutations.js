import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isValidationError } from '../api/client';
import {
  addComment,
  assignTicket,
  createTicket,
  reopenTicket,
  resolveTicket,
} from '../api/tickets';
import { queryKeys } from './queryKeys';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';

/**
 * Shared wiring for mutations that return the updated ticket:
 * - the response replaces the cached ticket detail (no extra refetch),
 * - list queries are invalidated so status/tab changes show up,
 * - validation errors (400) are left to the form; anything else becomes an error toast.
 */
function useTicketMutation({ mutationFn, successMessage }) {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const toast = useToast();

  return useMutation({
    mutationFn,
    onSuccess: (ticket) => {
      queryClient.setQueryData(queryKeys.ticket(currentUser.id, ticket.id), ticket);
      queryClient.invalidateQueries({ queryKey: queryKeys.ticketLists(currentUser.id) });
      toast.success(successMessage(ticket));
    },
    onError: (error) => {
      if (!isValidationError(error)) toast.error(error.message);
    },
  });
}

export function useCreateTicket() {
  return useTicketMutation({
    mutationFn: createTicket,
    successMessage: (ticket) => `Ticket #${ticket.code} created`,
  });
}

export function useAssignTicket(ticketId) {
  return useTicketMutation({
    mutationFn: (technicianId) => assignTicket(ticketId, technicianId),
    successMessage: (ticket) => `Assigned to ${ticket.assignees.at(-1).name}`,
  });
}

export function useResolveTicket(ticketId) {
  return useTicketMutation({
    mutationFn: (comment) => resolveTicket(ticketId, comment),
    successMessage: (ticket) => `#${ticket.code} marked as resolved`,
  });
}

export function useReopenTicket(ticketId) {
  return useTicketMutation({
    mutationFn: (comment) => reopenTicket(ticketId, comment),
    successMessage: (ticket) => `#${ticket.code} reopened`,
  });
}

/** Comments return the new activity, which is appended to the cached ticket. */
export function useAddComment(ticketId) {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUser();
  const toast = useToast();

  return useMutation({
    mutationFn: (text) => addComment(ticketId, text),
    onSuccess: (activity) => {
      queryClient.setQueryData(queryKeys.ticket(currentUser.id, ticketId), (ticket) =>
        ticket ? { ...ticket, activities: [...ticket.activities, activity] } : ticket,
      );
      toast.success('Comment posted');
    },
    onError: (error) => {
      if (!isValidationError(error)) toast.error(error.message);
    },
  });
}
