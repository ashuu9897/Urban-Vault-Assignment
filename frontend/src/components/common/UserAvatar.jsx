import { Avatar } from '@mui/material';
import PropTypes from 'prop-types';

import { avatarColor, initials } from '../../utils/people';
import { userSummaryShape } from '../../utils/propTypes';

/** Initials avatar with a stable per-user colour; `user = null` renders the System ("S"). */
export function UserAvatar({ user, size = 32 }) {
  return (
    <Avatar
      aria-hidden
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 600,
        color: '#fff',
        bgcolor: user ? avatarColor(user.id) : 'grey.600',
      }}
    >
      {user ? initials(user.name) : 'S'}
    </Avatar>
  );
}

UserAvatar.propTypes = {
  user: userSummaryShape,
  size: PropTypes.number,
};
