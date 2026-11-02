import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { Box, Chip, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { formatDateTime } from '../../utils/formatDate';
import { personLabel } from '../../utils/people';
import { activityShape } from '../../utils/propTypes';
import { SectionLabel } from '../common/SectionLabel';
import { SegmentedControl } from '../common/SegmentedControl';
import { Surface } from '../common/Surface';
import { TIMELINE_AVATAR_SIZE, Timeline, TimelineItem } from '../common/Timeline';
import { UserAvatar } from '../common/UserAvatar';

const FILTERS = [
  { value: 'all', label: 'All', matches: () => true },
  { value: 'actions', label: 'Actions', matches: (activity) => activity.type !== 'comment' },
  // Resolution notes count as comments too, even though they arrive with a status change.
  { value: 'comments', label: 'Comments', matches: (activity) => Boolean(activity.text) },
];

const SENTENCES = {
  created: { verb: 'created', rest: 'the ticket.', color: 'error.main' },
  auto_assigned: { verb: 'auto-assigned', rest: 'the ticket.', color: 'secondary.main' },
  assigned: { verb: 'assigned', rest: 'technician.', color: 'secondary.main' },
  status_changed: { verb: 'changed status', rest: 'of the ticket.', color: 'secondary.main' },
  comment: { verb: 'commented', rest: '', color: 'info.main' },
};

/** "Unassigned → Prakash Kumar (Technician)" or "Open → Resolved". */
function HistoryChange({ activity }) {
  const target = activity.to_user ? (
    <>
      <UserAvatar user={activity.to_user} size={20} />
      <Box component="span" sx={{ ml: 0.75 }}>
        {personLabel(activity.to_user)}
      </Box>
    </>
  ) : (
    activity.to_value
  );

  return (
    <Typography
      variant="body2"
      component="div"
      color="text.secondary"
      sx={{ mt: 0.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
    >
      {activity.from_value}
      <ArrowRightAltIcon aria-label="changed to" fontSize="small" sx={{ mx: 0.5 }} />
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          fontWeight: 600,
          color: 'text.primary',
        }}
      >
        {target}
      </Box>
    </Typography>
  );
}

HistoryChange.propTypes = {
  activity: activityShape.isRequired,
};

function ActivityEntry({ activity, isLast }) {
  const { verb, rest, color } = SENTENCES[activity.type];
  const hasHistory = Boolean(activity.from_value);

  return (
    <TimelineItem
      isLast={isLast}
      avatar={<UserAvatar user={activity.actor} size={TIMELINE_AVATAR_SIZE} />}
    >
      <Stack
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        useFlexGap
        columnGap={1}
        rowGap={0.5}
      >
        <Typography variant="body2">
          <Box component="span" sx={{ fontWeight: 600 }}>
            {personLabel(activity.actor)}
          </Box>{' '}
          <Box component="span" sx={{ color, fontWeight: 600 }}>
            {verb}
          </Box>
          {rest && ` ${rest}`}
        </Typography>
        <Chip
          size="small"
          variant="outlined"
          label={<time dateTime={activity.created_at}>{formatDateTime(activity.created_at)}</time>}
          sx={{ height: 22, fontSize: 12, color: 'text.secondary' }}
        />
      </Stack>

      {hasHistory && (
        <Box sx={{ mt: 1 }}>
          <SectionLabel component="p" outlined>
            History
          </SectionLabel>
          <HistoryChange activity={activity} />
        </Box>
      )}

      {activity.text && (
        <Box sx={{ mt: 1 }}>
          {activity.type !== 'comment' && (
            <SectionLabel component="p" outlined>
              Comment
            </SectionLabel>
          )}
          <Surface variant="inset" sx={{ mt: 0.5, p: 1.25 }}>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {activity.text}
            </Typography>
          </Surface>
        </Box>
      )}
    </TimelineItem>
  );
}

ActivityEntry.propTypes = {
  activity: activityShape.isRequired,
  isLast: PropTypes.bool.isRequired,
};

/** The ticket's audit trail with an All / Actions / Comments filter. */
export function ActivityTimeline({ activities }) {
  const [filter, setFilter] = useState('all');
  const { matches, label } = FILTERS.find((option) => option.value === filter);
  const visible = activities.filter(matches);

  return (
    <Box component="section" aria-labelledby="activity-heading">
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        useFlexGap
        flexWrap="wrap"
        sx={{ mb: 1.5 }}
      >
        <SectionLabel id="activity-heading">Activity</SectionLabel>
        <Typography variant="caption" color="text.secondary">
          {activities.length} {activities.length === 1 ? 'event' : 'events'}
        </Typography>
        <SegmentedControl
          ariaLabel="Filter activity"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          sx={{ ml: { sm: 'auto' } }}
        />
      </Stack>

      {visible.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No {label.toLowerCase()} yet.
        </Typography>
      ) : (
        <Timeline>
          {visible.map((activity, index) => (
            <ActivityEntry
              key={activity.id}
              activity={activity}
              isLast={index === visible.length - 1}
            />
          ))}
        </Timeline>
      )}
    </Box>
  );
}

ActivityTimeline.propTypes = {
  activities: PropTypes.arrayOf(activityShape).isRequired,
};
