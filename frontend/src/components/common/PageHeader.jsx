import { Box, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';

/** Page title (the page's <h1>) with a subtitle and an optional action on the right. */
export function PageHeader({ title, subtitle, action, titleId }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 2 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography id={titleId} component="h1" variant="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
    </Stack>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  titleId: PropTypes.string,
};
