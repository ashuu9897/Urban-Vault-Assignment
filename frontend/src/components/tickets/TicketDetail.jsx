import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FindInPageOutlinedIcon from '@mui/icons-material/FindInPageOutlined';
import TouchAppOutlinedIcon from '@mui/icons-material/TouchAppOutlined';
import { Box, Button, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

import { useTicket } from '../../hooks/useTicket';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { SectionLabel } from '../common/SectionLabel';
import { Surface } from '../common/Surface';
import { HEADER_HEIGHT } from '../layout/AppHeader';
import { ActivityTimeline } from './ActivityTimeline';
import { CommentComposer } from './CommentComposer';
import { TicketActionPanel } from './TicketActionPanel';
import { TicketSummary } from './TicketSummary';

/**
 * Fills the viewport below the app header. On desktop it also sticks while the ticket list
 * next to it scrolls; only the middle section scrolls inside it.
 */
const viewportPanelSx = {
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  minHeight: 420,
  height: {
    xs: `calc(100dvh - ${HEADER_HEIGHT + 32}px)`,
    md: `calc(100dvh - ${HEADER_HEIGHT + 48}px)`,
  },
  position: { md: 'sticky' },
  top: { md: HEADER_HEIGHT + 24 },
};

export function TicketDetail({ ticketId, justCreated = false, onBack, showBackButton }) {
  const { data: ticket, isPending, error, refetch } = useTicket(ticketId);
  const bodyRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  const scrollToLatest = () => {
    // Wait a frame so the new comment is in the DOM before scrolling to it.
    requestAnimationFrame(() => {
      const body = bodyRef.current;
      body?.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
    });
  };

  if (error?.status === 404) {
    return (
      <Surface sx={[viewportPanelSx, { justifyContent: 'center', p: 2 }]}>
        <EmptyState
          icon={FindInPageOutlinedIcon}
          title="Ticket not found"
          message="It may not exist, or it isn't visible to the user you are viewing as."
          action={
            <Button variant="outlined" onClick={onBack}>
              Back to tickets
            </Button>
          }
        />
      </Surface>
    );
  }

  return (
    <Surface component="article" aria-labelledby="ticket-detail-title" sx={viewportPanelSx}>
      {/* Top: summary + call to action. Gains a shadow once the body scrolls under it. */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderBottom: 1,
          borderColor: 'divider',
          position: 'relative',
          zIndex: 1,
          boxShadow: scrolled ? 3 : 'none',
          transition: 'box-shadow 150ms',
        }}
      >
        {showBackButton && (
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mb: 1, ml: -0.5 }}
          >
            Back to tickets
          </Button>
        )}
        {isPending && <LoadingSkeleton variant="detail" />}
        {error && <ErrorState message={error.message} onRetry={refetch} />}
        {ticket && (
          <Stack spacing={2}>
            <TicketSummary ticket={ticket} headingId="ticket-detail-title" size="large" />
            <TicketActionPanel ticket={ticket} justCreated={justCreated} />
          </Stack>
        )}
      </Box>

      {/* Middle: the only scrolling region. */}
      <Box
        ref={bodyRef}
        onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}
        sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 2.5 } }}
      >
        {ticket && (
          <Stack spacing={3}>
            <Box component="section" aria-labelledby="description-heading">
              <SectionLabel id="description-heading">Issue Description</SectionLabel>
              <Surface variant="inset">
                <Typography
                  variant="body2"
                  color={ticket.description ? 'text.primary' : 'text.secondary'}
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontStyle: ticket.description ? 'normal' : 'italic',
                  }}
                >
                  {ticket.description || 'No description provided.'}
                </Typography>
              </Surface>
            </Box>
            <ActivityTimeline activities={ticket.activities} />
          </Stack>
        )}
      </Box>

      {/* Bottom: comment box, always visible. */}
      {ticket && (
        <Box sx={{ p: 1.5, pb: 0.5, borderTop: 1, borderColor: 'divider' }}>
          <CommentComposer ticketId={ticket.id} onPosted={scrollToLatest} />
        </Box>
      )}
    </Surface>
  );
}

TicketDetail.propTypes = {
  ticketId: PropTypes.number.isRequired,
  justCreated: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  showBackButton: PropTypes.bool.isRequired,
};

/** Shown on desktop next to the list until a ticket is selected. */
export function TicketDetailPlaceholder() {
  return (
    <Surface sx={[viewportPanelSx, { justifyContent: 'center' }]}>
      <EmptyState
        icon={TouchAppOutlinedIcon}
        title="No ticket selected"
        message="Choose View on a ticket to see its details and activity."
      />
    </Surface>
  );
}
