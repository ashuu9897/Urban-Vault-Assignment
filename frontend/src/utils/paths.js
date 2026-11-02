/** Frontend URLs in one place, used by the route table and by every navigate() / link. */
export const paths = {
  tickets: '/tickets',
  ticket: (ticketId) => `/tickets/${ticketId}`,
};
