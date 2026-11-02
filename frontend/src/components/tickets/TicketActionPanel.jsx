import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DoneIcon from '@mui/icons-material/Done';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import { Alert } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ROLE } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatDate';
import { ticketShape } from '../../utils/propTypes';
import { ActionCallout } from '../common/ActionCallout';
import { AssignTechnicianForm } from './AssignTechnicianForm';
import { ResolveTicketForm } from './ResolveTicketForm';

const WAITING_FOR = {
  pending_assignment: 'the department POC to assign a technician',
  pending_resolution: 'the assigned technician to resolve it',
};

/** Wording and tone of the call to action; *which* action is offered comes from the API. */
function describeAction({ canAssign, isTechnician, justCreated }) {
  if (canAssign) {
    return {
      tone: 'warning',
      message: 'A new ticket has been assigned to you. Review it and take the next action.',
    };
  }
  if (isTechnician) {
    return { tone: 'warning', message: 'You have been assigned this ticket. Take action.' };
  }
  if (justCreated) {
    return {
      tone: 'success',
      message:
        'Ticket created successfully. If the issue is resolved, you can mark it as resolved.',
    };
  }
  return { tone: 'info', message: 'If the issue no longer persists, you can mark it as resolved.' };
}

/**
 * The call-to-action area at the top of a ticket. It renders whatever the backend says the
 * acting user may do (`available_actions`) and never re-derives permissions itself.
 */
export function TicketActionPanel({ ticket, justCreated = false }) {
  const { currentUser } = useCurrentUser();
  const [expanded, setExpanded] = useState(false);

  if (ticket.status === 'resolved') {
    return (
      <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
        This ticket was resolved on {formatDateTime(ticket.resolved_at)}.
      </Alert>
    );
  }

  const canAssign = ticket.available_actions.includes('assign');
  const canResolve = ticket.available_actions.includes('resolve');
  if (!canAssign && !canResolve) {
    return (
      <Alert severity="info" variant="outlined">
        No action needed from you. Waiting for {WAITING_FOR[ticket.status]}.
      </Alert>
    );
  }

  const isTechnician = currentUser.role === ROLE.technician;
  const { tone, message } = describeAction({ canAssign, isTechnician, justCreated });
  const collapse = () => setExpanded(false);

  return (
    <ActionCallout
      tone={tone}
      message={message}
      actionLabel={canAssign ? 'Assign Worker' : 'Mark Resolved'}
      actionIcon={canAssign ? <PersonAddAlt1OutlinedIcon /> : <DoneIcon />}
      actionColor={canAssign ? 'primary' : 'success'}
      expanded={expanded}
      onExpand={() => setExpanded(true)}
    >
      {canAssign ? (
        <AssignTechnicianForm
          ticketId={ticket.id}
          departmentName={ticket.department.name}
          onCancel={collapse}
        />
      ) : (
        <ResolveTicketForm
          ticketId={ticket.id}
          commentRequired={isTechnician}
          onCancel={collapse}
        />
      )}
    </ActionCallout>
  );
}

TicketActionPanel.propTypes = {
  ticket: ticketShape.isRequired,
  justCreated: PropTypes.bool,
};
