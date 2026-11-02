import { Alert, Snackbar } from '@mui/material';
import PropTypes from 'prop-types';
import { useCallback, useMemo, useState } from 'react';

import { MOBILE_BOTTOM_INSET } from '../theme/layout';
import { ToastContext } from './ToastContext';

/** One toast at a time; a new message replaces the current one. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((severity, message) => {
    setToast({ severity, message, key: Date.now() });
  }, []);

  const api = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
    }),
    [show],
  );

  const handleClose = (_event, reason) => {
    if (reason !== 'clickaway') setToast(null);
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: MOBILE_BOTTOM_INSET, md: 24 } }}
      >
        {toast ? (
          <Alert
            severity={toast.severity}
            variant="filled"
            onClose={handleClose}
            role={toast.severity === 'error' ? 'alert' : 'status'}
            sx={{ width: '100%' }}
          >
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
