import SendIcon from '@mui/icons-material/Send';
import { Box, Button } from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { fieldError } from '../../api/client';
import { useAddComment } from '../../hooks/useTicketMutations';
import { COMMENT_MAX_LENGTH } from '../../utils/constants';
import { CountedTextField } from '../common/CountedTextField';

/** "Write a comment" + Post. Ctrl/⌘+Enter also posts. */
export function CommentComposer({ ticketId, onPosted }) {
  const addComment = useAddComment(ticketId);
  const [text, setText] = useState('');
  const canPost =
    text.trim().length > 0 && text.length <= COMMENT_MAX_LENGTH && !addComment.isPending;

  const post = () => {
    if (!canPost) return;
    addComment.mutate(text, {
      onSuccess: () => {
        setText('');
        onPosted();
      },
    });
  };

  const handleChange = (nextText) => {
    setText(nextText);
    if (addComment.error) addComment.reset();
  };

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        post();
      }}
      sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}
    >
      <CountedTextField
        size="small"
        fullWidth
        multiline
        maxRows={4}
        placeholder="Write a comment"
        value={text}
        onChange={handleChange}
        maxLength={COMMENT_MAX_LENGTH}
        hint="Ctrl/⌘+Enter to post"
        error={fieldError(addComment.error, 'text')}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            post();
          }
        }}
        slotProps={{ htmlInput: { 'aria-label': 'Write a comment' } }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={!canPost}
        loading={addComment.isPending}
        endIcon={<SendIcon />}
        sx={{ flexShrink: 0, height: 40 }}
      >
        Post
      </Button>
    </Box>
  );
}

CommentComposer.propTypes = {
  ticketId: PropTypes.number.isRequired,
  onPosted: PropTypes.func.isRequired,
};
