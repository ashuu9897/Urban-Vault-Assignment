import PropTypes from 'prop-types';

/** Shapes mirroring the API's JSON, shared by every component that renders them. */

export const userSummaryShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  designation: PropTypes.string.isRequired,
  role: PropTypes.oneOf(['client', 'poc', 'technician']).isRequired,
});

export const userShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  designation: PropTypes.string.isRequired,
  role: PropTypes.oneOf(['client', 'poc', 'technician']).isRequired,
  department: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }),
  organization: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    site_label: PropTypes.string,
  }),
});

export const categoryShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  is_quick_issue: PropTypes.bool.isRequired,
  department: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }).isRequired,
});

export const activityShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['created', 'auto_assigned', 'assigned', 'status_changed', 'comment'])
    .isRequired,
  actor: userSummaryShape,
  from_value: PropTypes.string.isRequired,
  to_value: PropTypes.string.isRequired,
  to_user: userSummaryShape,
  text: PropTypes.string.isRequired,
  created_at: PropTypes.string.isRequired,
});

export const ticketShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  code: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['pending_assignment', 'pending_resolution', 'resolved']).isRequired,
  organization: PropTypes.shape({ name: PropTypes.string, site_label: PropTypes.string })
    .isRequired,
  department: PropTypes.shape({ id: PropTypes.number, name: PropTypes.string }).isRequired,
  created_by: userSummaryShape.isRequired,
  assignees: PropTypes.arrayOf(userSummaryShape).isRequired,
  created_at: PropTypes.string.isRequired,
  resolved_at: PropTypes.string,
  available_actions: PropTypes.arrayOf(PropTypes.oneOf(['assign', 'resolve', 'reopen'])).isRequired,
  action_required: PropTypes.bool.isRequired,
  description: PropTypes.string,
  activities: PropTypes.arrayOf(activityShape),
});
