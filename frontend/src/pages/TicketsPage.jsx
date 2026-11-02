import AddIcon from '@mui/icons-material/Add';
import { Box, Button, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useCallback, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { PageHeader } from '../components/common/PageHeader';
import { Surface } from '../components/common/Surface';
import { CreateTicketDialog } from '../components/tickets/CreateTicketDialog';
import { TicketDetail, TicketDetailPlaceholder } from '../components/tickets/TicketDetail';
import { TicketList } from '../components/tickets/TicketList';
import { TicketListToolbar } from '../components/tickets/TicketListToolbar';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTicketListParams } from '../hooks/useTicketListParams';
import { useTickets } from '../hooks/useTickets';
import { ROLE } from '../utils/constants';
import { paths } from '../utils/paths';
import { NotFoundPage } from './NotFoundPage';

function subtitleFor(user) {
  if (user.role === ROLE.client) return `Tickets you raised · ${user.organization.name}`;
  if (user.role === ROLE.poc) return `All tickets for the ${user.department.name} department`;
  return 'Tickets assigned to you';
}

/**
 * /tickets and /tickets/:ticketId. Desktop shows list and detail side by side; on mobile
 * the detail replaces the list. The list's filters live in the URL query string, which is
 * carried along when opening or closing a ticket.
 */
export function TicketsPage() {
  const { ticketId: ticketIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const { currentUser } = useCurrentUser();
  const { params, updateParams, clearFilters } = useTicketListParams();
  const [createOpen, setCreateOpen] = useState(false);

  const goToFirstPage = useCallback(
    () => updateParams({ page: 1 }, { replace: true }),
    [updateParams],
  );
  const ticketsQuery = useTickets(params, goToFirstPage);

  const ticketId = ticketIdParam === undefined ? null : Number(ticketIdParam);
  if (ticketId !== null && !Number.isInteger(ticketId)) return <NotFoundPage />;

  const openTicket = (id) => navigate({ pathname: paths.ticket(id), search: location.search });
  const closeTicket = () => navigate({ pathname: paths.tickets, search: location.search });
  const handleCreated = (ticket) => {
    setCreateOpen(false);
    // Default list filters so the new ticket is at the top, plus the "created" banner.
    navigate(paths.ticket(ticket.id), { state: { justCreated: true } });
  };

  const list = (
    <Box component="section" aria-labelledby="tickets-heading" sx={{ minWidth: 0 }}>
      <PageHeader
        title="Tickets"
        titleId="tickets-heading"
        subtitle={subtitleFor(currentUser)}
        action={
          currentUser.role === ROLE.client && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
              Create New Ticket
            </Button>
          )
        }
      />
      <Surface sx={{ p: { xs: 1.5, sm: 2 } }}>
        <TicketListToolbar params={params} onChange={updateParams} />
        <TicketList
          data={ticketsQuery.data}
          isPending={ticketsQuery.isPending}
          isRefreshing={ticketsQuery.isPlaceholderData}
          error={ticketsQuery.isError ? ticketsQuery.error : null}
          onRetry={() => ticketsQuery.refetch()}
          tab={params.tab}
          hasFilters={Boolean(params.status || params.search)}
          onClearFilters={clearFilters}
          page={params.page}
          onPageChange={(page) => updateParams({ page })}
          selectedId={ticketId}
          onView={openTicket}
        />
      </Surface>
    </Box>
  );

  const detail = ticketId ? (
    <TicketDetail
      // Remount per ticket and per user so half-filled forms never leak between them.
      key={`${currentUser.id}-${ticketId}`}
      ticketId={ticketId}
      justCreated={Boolean(location.state?.justCreated)}
      onBack={closeTicket}
      showBackButton={!isDesktop}
    />
  ) : (
    <TicketDetailPlaceholder />
  );

  let content;
  if (isDesktop) {
    content = (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 7fr)',
          gap: 3,
          alignItems: 'start',
        }}
      >
        {list}
        {detail}
      </Box>
    );
  } else {
    content = ticketId ? detail : list;
  }

  return (
    <>
      {content}
      <CreateTicketDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
