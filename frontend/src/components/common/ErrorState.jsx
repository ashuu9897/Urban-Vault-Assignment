import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, AlertTitle, Button } from '@mui/material';
import PropTypes from 'prop-types';

export function ErrorState({ title = "Couldn't load data", message, onRetry }) {
  return (
    <Alert
      severity="error"
      role="alert"
      action={
        onRetry && (
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}

ErrorState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};
