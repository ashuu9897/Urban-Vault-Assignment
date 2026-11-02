import { apiClient } from './client';

export async function listUsers() {
  const { data } = await apiClient.get('/users/');
  return data;
}
