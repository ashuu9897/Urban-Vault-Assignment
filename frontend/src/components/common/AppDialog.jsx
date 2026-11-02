import { Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { useId } from 'react';

/**
 * Generic modal: a title, any content, and an optional row of actions.
 *
 * - Full-screen on phones.
 * - Pass `onSubmit` to turn the whole dialog into a <form> (Enter submits, and a
 *   `type="submit"` button in `actions` works).
 * - While `busy` the dialog can't be dismissed, so an in-flight request isn't abandoned.
 */
export function AppDialog({
  open,
  onClose,
  title,
  children,
  actions,
  onSubmit,
  busy = false,
  maxWidth = 'sm',
  onExited,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={maxWidth}
      aria-labelledby={titleId}
      PaperProps={onSubmit ? { component: 'form', onSubmit, noValidate: true } : undefined}
      TransitionProps={{ onExited }}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {actions && <DialogActions sx={{ px: 3, py: 2 }}>{actions}</DialogActions>}
    </Dialog>
  );
}

AppDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  actions: PropTypes.node,
  onSubmit: PropTypes.func,
  busy: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg']),
  onExited: PropTypes.func,
};
