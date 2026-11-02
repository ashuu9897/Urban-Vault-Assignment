import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';

export function EmptyState({ title, message, action, icon: Icon = InboxOutlinedIcon }) {
  return (
    <Box role="status" sx={{ textAlign: 'center', py: 6, px: 2 }}>
      <Box
        sx={{
          mx: 'auto',
          mb: 1.5,
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'action.hover',
          color: 'text.secondary',
        }}
      >
        <Icon aria-hidden fontSize="medium" />
      </Box>
      <Typography variant="subtitle1" component="p">
        {title}
      </Typography>
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {message}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  message: PropTypes.string,
  action: PropTypes.node,
  icon: PropTypes.elementType,
};
