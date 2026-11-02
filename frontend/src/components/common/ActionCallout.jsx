import { Box, Button, Collapse, Divider, Stack, Typography } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * A tinted call-to-action box: a message, one button, and content that expands below it
 * (typically a small form) when the button is pressed. The parent owns `expanded` so the
 * content can close it again (e.g. a Cancel button).
 */
export function ActionCallout({
  tone,
  message,
  actionLabel,
  actionIcon,
  actionColor = 'primary',
  expanded,
  onExpand,
  children,
}) {
  return (
    <Box
      sx={(theme) => ({
        p: 1.5,
        borderRadius: 2,
        border: 1,
        borderColor: `rgba(${theme.vars.palette[tone].mainChannel} / 0.4)`,
        bgcolor: `rgba(${theme.vars.palette[tone].mainChannel} / 0.08)`,
      })}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }} role="status">
          {message}
        </Typography>
        {!expanded && (
          <Button
            variant="contained"
            size="small"
            color={actionColor}
            startIcon={actionIcon}
            onClick={onExpand}
            sx={{ flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'center' } }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
      <Collapse in={expanded} unmountOnExit>
        <Divider sx={{ my: 1.5 }} />
        {children}
      </Collapse>
    </Box>
  );
}

ActionCallout.propTypes = {
  tone: PropTypes.oneOf(['info', 'success', 'warning', 'error']).isRequired,
  message: PropTypes.node.isRequired,
  actionLabel: PropTypes.string.isRequired,
  actionIcon: PropTypes.element,
  actionColor: PropTypes.oneOf(['primary', 'success', 'warning', 'error']),
  expanded: PropTypes.bool.isRequired,
  onExpand: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};
