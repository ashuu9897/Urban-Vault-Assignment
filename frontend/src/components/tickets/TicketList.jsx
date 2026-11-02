import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { PAGE_SIZE } from '../../utils/constants';
import { ticketShape } from '../../utils/propTypes';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { PaginationBar } from '../common/PaginationBar';
import { TicketCard } from './TicketCard';

const EMPTY_TAB_COPY = {
  open: { title: 'No open tickets', message: "You're all caught up." },
  resolved: { title: 'No resolved tickets yet', message: 'Resolved tickets will appear here.' },
};

function ListBody({
  data,
  isPending,
  error,
  onRetry,
  tab,
  hasFilters,
  onClearFilters,
  page,
  onPageChange,
  isRefreshing,
  selectedId,
  onView,
}) {
  if (isPending) return <LoadingSkeleton variant="card" count={3} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;

  if (data.count === 0) {
    return hasFilters ? (
      <EmptyState
        icon={SearchOffOutlinedIcon}
        title="No matching tickets"
        message="Try a different search term or clear the filters."
        action={
          <Button variant="outlined" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState {...EMPTY_TAB_COPY[tab]} />
    );
  }

  const first = (page - 1) * PAGE_SIZE + 1;
  const last = first + data.results.length - 1;
  return (
    <>
      <Typography variant="body2" color="text.secondary" aria-live="polite" sx={{ mb: 1.5 }}>
        Showing {first}–{last} of {data.count}
      </Typography>
      <Stack
        component="ul"
        spacing={1.5}
        sx={{ p: 0, m: 0, opacity: isRefreshing ? 0.6 : 1, transition: 'opacity 150ms' }}
      >
        {data.results.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            selected={ticket.id === selectedId}
            onView={onView}
          />
        ))}
      </Stack>
      <PaginationBar
        count={data.count}
        page={page}
        pageSize={PAGE_SIZE}
        onChange={onPageChange}
        disabled={isRefreshing}
        ariaLabel="Ticket list pages"
      />
    </>
  );
}

/** The tab panel below the toolbar: loading, error, empty, or the paginated cards. */
export function TicketList(props) {
  const { tab, isPending, isRefreshing } = props;
  return (
    <Box
      id="ticket-list"
      role="tabpanel"
      aria-labelledby={`tab-${tab}`}
      aria-busy={isPending || isRefreshing}
      sx={{ mt: 2 }}
    >
      <ListBody {...props} />
    </Box>
  );
}

const propTypes = {
  data: PropTypes.shape({
    count: PropTypes.number.isRequired,
    results: PropTypes.arrayOf(ticketShape).isRequired,
  }),
  isPending: PropTypes.bool.isRequired,
  isRefreshing: PropTypes.bool,
  error: PropTypes.shape({ message: PropTypes.string.isRequired }),
  onRetry: PropTypes.func.isRequired,
  tab: PropTypes.oneOf(['open', 'resolved']).isRequired,
  hasFilters: PropTypes.bool.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  selectedId: PropTypes.number,
  onView: PropTypes.func.isRequired,
};

ListBody.propTypes = propTypes;
TicketList.propTypes = propTypes;
