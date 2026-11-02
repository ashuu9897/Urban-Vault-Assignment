import { Box } from '@mui/material';
import PropTypes from 'prop-types';

/** Avatars passed to <TimelineItem> should be this size so the connector line lines up. */
export const TIMELINE_AVATAR_SIZE = 32;

/** Ordered list of events; use with <TimelineItem>. */
export function Timeline({ children }) {
  return (
    <Box component="ol" sx={{ p: 0, m: 0 }}>
      {children}
    </Box>
  );
}

Timeline.propTypes = {
  children: PropTypes.node.isRequired,
};

/** One event: an avatar on the left joined to the next event by a vertical line. */
export function TimelineItem({ avatar, isLast, children }) {
  return (
    <Box
      component="li"
      sx={{
        position: 'relative',
        display: 'flex',
        gap: 1.5,
        pb: isLast ? 0 : 2.5,
        listStyle: 'none',
        '&::before': isLast
          ? undefined
          : {
              content: '""',
              position: 'absolute',
              left: TIMELINE_AVATAR_SIZE / 2 - 1,
              top: TIMELINE_AVATAR_SIZE + 4,
              bottom: 4,
              width: 2,
              borderRadius: 1,
              bgcolor: 'divider',
            },
      }}
    >
      {avatar}
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>{children}</Box>
    </Box>
  );
}

TimelineItem.propTypes = {
  avatar: PropTypes.element.isRequired,
  isLast: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};
