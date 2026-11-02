import { Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';

/** A small decorative icon followed by secondary text. */
export function IconText({ icon: Icon, children }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="flex-start">
      <Icon aria-hidden sx={{ fontSize: 16, mt: '2px', color: 'text.secondary' }} />
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
        {children}
      </Typography>
    </Stack>
  );
}

IconText.propTypes = {
  icon: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
};
