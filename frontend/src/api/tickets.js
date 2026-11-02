import { apiClient } from './client';

/** GET /tickets/ – `params`: { tab, status, search, ordering, page, page_size } */
export async function listTickets(params) {
  const { data } = await apiClient.get('/tickets/', { params });
  return data;
}

export async function getTicket(ticketId) {
  const { data } = await apiClient.get(`/tickets/${ticketId}/`);
  return data;
}

export async function createTicket({ categoryId, description }) {
  const { data } = await apiClient.post('/tickets/', { category_id: categoryId, description });
  return data;
}

export async function getAssignableTechnicians(ticketId) {
  const { data } = await apiClient.get(`/tickets/${ticketId}/assignable-technicians/`);
  return data;
}

export async function assignTicket(ticketId, technicianId) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/assign/`, {
    technician_id: technicianId,
  });
  return data;
}

export async function resolveTicket(ticketId, comment) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/resolve/`, { comment });
  return data;
}

export async function reopenTicket(ticketId, comment) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/reopen/`, { comment });
  return data;
}

/** Returns the created activity entry. */
export async function addComment(ticketId, text) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/comments/`, { text });
  return data;
}
