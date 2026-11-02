import { Alert, Button, Stack } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { fieldError, isValidationError } from '../../api/client';
import { useResolveTicket } from '../../hooks/useTicketMutations';
import { COMMENT_MAX_LENGTH, RESOLUTION_COMMENT_MIN_LENGTH } from '../../utils/constants';
import { CountedTextField } from '../common/CountedTextField';

const REQUIRED_MESSAGE = `A resolution comment (min ${RESOLUTION_COMMENT_MIN_LENGTH} characters) is required.`;

/** Resolution comment + Submit. Technicians must explain the fix; clients may skip it. */
export function ResolveTicketForm({ ticketId, commentRequired, onCancel }) {
  const resolve = useResolveTicket(ticketId);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tooShort = commentRequired && comment.trim().length < RESOLUTION_COMMENT_MIN_LENGTH;
  const commentError =
    (submitted && tooShort && REQUIRED_MESSAGE) || fieldError(resolve.error, 'comment');
  const generalError =
    isValidationError(resolve.error) && !fieldError(resolve.error, 'comment')
      ? resolve.error.message
      : null;

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!tooShort && comment.length <= COMMENT_MAX_LENGTH) resolve.mutate(comment);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError && (
        <Alert severity="error" role="alert" sx={{ mb: 1.5 }}>
          {generalError}
        </Alert>
      )}
      <CountedTextField
        label={commentRequired ? 'Comment' : 'Comment (optional)'}
        required={commentRequired}
        placeholder={commentRequired ? 'What was done to fix the issue?' : 'Anything to add?'}
        multiline
        minRows={2}
        maxRows={6}
        fullWidth
        size="small"
        value={comment}
        onChange={setComment}
        maxLength={COMMENT_MAX_LENGTH}
        error={commentError}
        disabled={resolve.isPending}
      />
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 1 }}>
        <Button color="inherit" onClick={onCancel} disabled={resolve.isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" color="success" loading={resolve.isPending}>
          Submit
        </Button>
      </Stack>
    </form>
  );
}

ResolveTicketForm.propTypes = {
  ticketId: PropTypes.number.isRequired,
  commentRequired: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
};
