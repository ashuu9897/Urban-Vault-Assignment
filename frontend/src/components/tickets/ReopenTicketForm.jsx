import { Alert, Button, Stack } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { fieldError, isValidationError } from '../../api/client';
import { useReopenTicket } from '../../hooks/useTicketMutations';
import { COMMENT_MAX_LENGTH, REOPEN_REASON_MIN_LENGTH } from '../../utils/constants';
import { CountedTextField } from '../common/CountedTextField';

const REQUIRED_MESSAGE = `Please say why the ticket is being reopened (min ${REOPEN_REASON_MIN_LENGTH} characters).`;

/** Reason + Reopen. A reason is always required so the next person knows what is wrong. */
export function ReopenTicketForm({ ticketId, onCancel }) {
  const reopen = useReopenTicket(ticketId);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tooShort = comment.trim().length < REOPEN_REASON_MIN_LENGTH;
  const commentError =
    (submitted && tooShort && REQUIRED_MESSAGE) || fieldError(reopen.error, 'comment');
  const generalError =
    isValidationError(reopen.error) && !fieldError(reopen.error, 'comment')
      ? reopen.error.message
      : null;

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!tooShort && comment.length <= COMMENT_MAX_LENGTH) reopen.mutate(comment);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError && (
        <Alert severity="error" role="alert" sx={{ mb: 1.5 }}>
          {generalError}
        </Alert>
      )}
      <CountedTextField
        label="Reason for reopening"
        required
        placeholder="What is still wrong?"
        multiline
        minRows={2}
        maxRows={6}
        fullWidth
        size="small"
        value={comment}
        onChange={setComment}
        maxLength={COMMENT_MAX_LENGTH}
        error={commentError}
        disabled={reopen.isPending}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button color="inherit" onClick={onCancel} disabled={reopen.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" color="warning" loading={reopen.isPending}>
          Reopen
        </Button>
      </Stack>
    </form>
  );
}

ReopenTicketForm.propTypes = {
  ticketId: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
};
