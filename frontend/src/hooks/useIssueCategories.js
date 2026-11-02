import { useQuery } from '@tanstack/react-query';

import { listIssueCategories } from '../api/categories';
import { queryKeys } from './queryKeys';

export function useIssueCategories() {
  return useQuery({
    queryKey: queryKeys.issueCategories,
    queryFn: listIssueCategories,
    staleTime: Infinity,
  });
}
