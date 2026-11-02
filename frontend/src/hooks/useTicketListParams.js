import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { ORDERING_OPTIONS, STATUS_OPTIONS_BY_TAB } from '../utils/constants';

export const DEFAULT_LIST_PARAMS = {
  tab: 'open',
  status: '',
  search: '',
  ordering: '-created_at',
  page: 1,
};

/** Read list params from the URL, falling back to defaults for anything missing or invalid. */
function parseParams(searchParams) {
  const tab = searchParams.get('tab') === 'resolved' ? 'resolved' : 'open';
  const status = searchParams.get('status') ?? '';
  const ordering = searchParams.get('ordering') ?? '';
  const page = Number.parseInt(searchParams.get('page') ?? '', 10);
  return {
    tab,
    status: STATUS_OPTIONS_BY_TAB[tab].includes(status) ? status : '',
    search: searchParams.get('search') ?? '',
    ordering: ORDERING_OPTIONS.some((option) => option.value === ordering)
      ? ordering
      : DEFAULT_LIST_PARAMS.ordering,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** Only non-default values go into the URL, so the plain /tickets link stays clean. */
function toSearchParams(params) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== DEFAULT_LIST_PARAMS[key]) next.set(key, String(value));
  });
  return next;
}

/**
 * Ticket list state (tab, status, search, ordering, page) lives in the URL search params so
 * refresh, back/forward and shared links all restore the same view.
 */
export function useTicketListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseParams(searchParams), [searchParams]);

  /** Merge `changes`; changing anything other than the page goes back to page 1. */
  const updateParams = useCallback(
    (changes, { replace = false } = {}) => {
      setSearchParams(
        (current) => {
          const resetPage = Object.keys(changes).some((key) => key !== 'page');
          return toSearchParams({
            ...parseParams(current),
            ...(resetPage && { page: 1 }),
            ...changes,
          });
        },
        { replace },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => updateParams({ status: '', search: '' }), [updateParams]);

  return { params, updateParams, clearFilters };
}
