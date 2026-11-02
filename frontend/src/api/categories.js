import { apiClient } from './client';

export async function listIssueCategories() {
  const { data } = await apiClient.get('/issue-categories/');
  return data;
}
