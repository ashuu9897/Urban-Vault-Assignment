import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Box, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { TICKET_STATUS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatDate';
import { personLabel } from '../../utils/people';
import { ticketShape } from '../../utils/propTypes';
import { IconText } from '../common/IconText';
import { TonalChip } from '../common/TonalChip';

function Strong({ children }) {
  return (
    <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
      {children}
    </Box>
  );
}

Strong.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Title, code, status and Action Required chips, then location / created / assignees.
 * Shared by the list card (`size="compact"`) and the detail header (`size="large"`).
 */
export function TicketSummary({ ticket, headingId, size = 'compact' }) {
  const status = TICKET_STATUS[ticket.status];
  const StatusIcon = ticket.status === 'resolved' ? CheckCircleOutlineIcon : ScheduleIcon;
  const { organization, created_by: createdBy, assignees } = ticket;

  return (
    <Stack spacing={1}>
      <Stack direction="row" alignItems="center" flexWrap="wrap" useFlexGap spacing={1}>
        <Typography
          id={headingId}
          component={size === 'large' ? 'h2' : 'h3'}
          variant={size === 'large' ? 'h2' : 'subtitle1'}
          sx={{ fontWeight: 700, mr: 0.5 }}
        >
          {ticket.title}
        </Typography>
        <TonalChip label={`#${ticket.code}`} color="primary" />
        <TonalChip label={status.label} color={status.color} icon={<StatusIcon aria-hidden />} />
        {ticket.action_required && (
          <TonalChip
            label="Action Required"
            color="error"
            variant="solid"
            icon={<ErrorOutlineIcon aria-hidden />}
          />
        )}
      </Stack>
      <Stack spacing={0.5}>
        <IconText icon={PlaceOutlinedIcon}>
          <Strong>{organization.name}</Strong> · {organization.site_label}
        </IconText>
        <IconText icon={EventOutlinedIcon}>
          <Strong>Created</Strong> {formatDateTime(ticket.created_at)} · {personLabel(createdBy)}
        </IconText>
        <IconText icon={PeopleOutlineIcon}>
          <Strong>Current Assignee(s)</Strong> {assignees.map(personLabel).join(', ')}
        </IconText>
      </Stack>
    </Stack>
  );
}

TicketSummary.propTypes = {
  ticket: ticketShape.isRequired,
  headingId: PropTypes.string,
  size: PropTypes.oneOf(['compact', 'large']),
};
