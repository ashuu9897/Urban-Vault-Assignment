import { Box, Button, Card } from '@mui/material';
import PropTypes from 'prop-types';

import { ticketShape } from '../../utils/propTypes';
import { TicketSummary } from './TicketSummary';

/**
 * One row of the ticket list. The whole card is clickable for mouse users; keyboard and
 * screen-reader users get a single tab stop, the View button, and keyboard focus outlines the
 * entire card. This avoids nesting a button inside another interactive element.
 */
export function TicketCard({ ticket, selected, onView }) {
  const headingId = `ticket-${ticket.id}-title`;

  return (
    <Card
      component="li"
      onClick={() => onView(ticket.id)}
      sx={(theme) => ({
        listStyle: 'none',
        cursor: 'pointer',
        p: 2,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'flex-start' },
        gap: 1.5,
        transition: theme.transitions.create(['border-color', 'box-shadow']),
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.06)` : undefined,
        '&:hover': { borderColor: 'primary.main', boxShadow: theme.shadows[2] },
        // Keyboard focus on the View button outlines the whole card instead.
        '&:has(.view-button:focus-visible)': {
          outline: `2px solid ${theme.vars.palette.primary.main}`,
          outlineOffset: 2,
        },
        '& .view-button:focus-visible': { outline: 'none' },
      })}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TicketSummary ticket={ticket} headingId={headingId} />
      </Box>
      <Button
        className="view-button"
        variant={selected ? 'contained' : 'outlined'}
        size="small"
        onClick={(event) => {
          event.stopPropagation(); // the card's own click handler would open it a second time
          onView(ticket.id);
        }}
        aria-describedby={headingId}
        aria-current={selected ? 'true' : undefined}
        sx={{ flexShrink: 0, alignSelf: { xs: 'flex-end', sm: 'flex-start' } }}
      >
        View
      </Button>
    </Card>
  );
}

TicketCard.propTypes = {
  ticket: ticketShape.isRequired,
  selected: PropTypes.bool.isRequired,
  onView: PropTypes.func.isRequired,
};
