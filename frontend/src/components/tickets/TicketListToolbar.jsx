import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { Box, Chip, Stack, Tab, Tabs } from '@mui/material';
import PropTypes from 'prop-types';

import {
  ORDERING_OPTIONS,
  SEARCH_DEBOUNCE_MS,
  STATUS_OPTIONS_BY_TAB,
  TICKET_STATUS,
} from '../../utils/constants';
import { MenuSelectButton } from '../common/MenuSelectButton';
import { SearchField } from '../common/SearchField';

/** Only the statuses that can appear in the current tab are offered as filters. */
function statusOptionsFor(tab) {
  return [
    { value: '', label: tab === 'open' ? 'All open' : 'All resolved' },
    ...STATUS_OPTIONS_BY_TAB[tab].map((status) => ({
      value: status,
      label: TICKET_STATUS[status].label,
    })),
  ];
}

/** Tabs, search, status filter and sort for the ticket list, plus chips for active filters. */
export function TicketListToolbar({ params, onChange }) {
  const { tab, status, search, ordering } = params;
  const statusLabel = status ? TICKET_STATUS[status].label : '';
  const orderingLabel = ORDERING_OPTIONS.find((option) => option.value === ordering).label;

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_event, nextTab) => onChange({ tab: nextTab, status: '' })}
        aria-label="Ticket tabs"
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab value="open" label="Open Tickets" id="tab-open" aria-controls="ticket-list" />
        <Tab
          value="resolved"
          label="Resolved Tickets"
          id="tab-resolved"
          aria-controls="ticket-list"
        />
      </Tabs>

      <Stack direction="row" spacing={1} alignItems="center">
        <SearchField
          value={search}
          // Typing creates no browser-history entries; filters and sort do.
          onSearch={(text) => onChange({ search: text }, { replace: true })}
          placeholder="Search by issue or ticket #"
          ariaLabel="Search tickets by issue or ticket number"
          debounceMs={SEARCH_DEBOUNCE_MS}
        />
        <MenuSelectButton
          id="status-filter-button"
          icon={<FilterListIcon />}
          label="Filters"
          ariaLabel={status ? `Filters: ${statusLabel}` : 'Filters'}
          menuTitle="Filter by status"
          options={statusOptionsFor(tab)}
          value={status}
          onChange={(next) => onChange({ status: next })}
          showDot={Boolean(status)}
        />
        <MenuSelectButton
          id="sort-button"
          icon={<SortIcon />}
          label={orderingLabel}
          ariaLabel={`Sort: ${orderingLabel}`}
          menuTitle="Sort by created time"
          options={ORDERING_OPTIONS}
          value={ordering}
          onChange={(next) => onChange({ ordering: next })}
        />
      </Stack>

      {(status || search) && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
          {status && (
            <Chip
              size="small"
              label={`Status: ${statusLabel}`}
              onDelete={() => onChange({ status: '' })}
            />
          )}
          {search && (
            <Chip
              size="small"
              label={`Search: "${search}"`}
              onDelete={() => onChange({ search: '' })}
              sx={{ maxWidth: '100%' }}
            />
          )}
        </Stack>
      )}
    </Box>
  );
}

TicketListToolbar.propTypes = {
  params: PropTypes.shape({
    tab: PropTypes.oneOf(['open', 'resolved']).isRequired,
    status: PropTypes.string.isRequired,
    search: PropTypes.string.isRequired,
    ordering: PropTypes.string.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};
