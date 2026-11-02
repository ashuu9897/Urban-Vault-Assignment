/**
 * Ticket data is keyed by the acting user because the same ticket id can look different
 * (or be invisible) to different users. Everything for one user shares the `[x, userId]`
 * prefix so it can be dropped in one go when switching users.
 */
export const queryKeys = {
  users: ['users'],
  issueCategories: ['issue-categories'],
  ticketLists: (userId) => ['tickets', userId],
  ticketList: (userId, params) => ['tickets', userId, params],
  ticket: (userId, ticketId) => ['ticket', userId, ticketId],
  assignableTechnicians: (userId, ticketId) => ['ticket', userId, ticketId, 'technicians'],
};
