import { Alert, Autocomplete, Box, Button, TextField, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { useMemo, useState } from 'react';

import { fieldError, isValidationError } from '../../api/client';
import { useIssueCategories } from '../../hooks/useIssueCategories';
import { useCreateTicket } from '../../hooks/useTicketMutations';
import { DESCRIPTION_MAX_LENGTH } from '../../utils/constants';
import { AppDialog } from '../common/AppDialog';
import { ChoiceChips } from '../common/ChoiceChips';
import { CountedTextField } from '../common/CountedTextField';
import { ErrorState } from '../common/ErrorState';
import { Surface } from '../common/Surface';

/**
 * Autocomplete's `groupBy` needs options of the same group to be adjacent. Group by
 * department while keeping the API's order (departments in order of first appearance).
 */
function groupByDepartment(categories) {
  const groups = new Map();
  categories.forEach((category) => {
    const name = category.department.name;
    groups.set(name, [...(groups.get(name) ?? []), category]);
  });
  return [...groups.values()].flat();
}

/** The create-ticket form, shown in the generic AppDialog. */
export function CreateTicketDialog({ open, onClose, onCreated }) {
  const categoriesQuery = useIssueCategories();
  const createTicket = useCreateTicket();

  const [category, setCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const options = useMemo(
    () => groupByDepartment(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const quickIssueOptions = options
    .filter((option) => option.is_quick_issue)
    .map((option) => ({ value: option.id, label: option.name }));

  const serverError = createTicket.error;
  const issueError =
    (submitted && !category && 'Please select an issue.') || fieldError(serverError, 'category_id');
  const nonFieldError = isValidationError(serverError)
    ? fieldError(serverError, 'non_field_errors')
    : undefined;

  const selectCategory = (nextCategory) => {
    setCategory(nextCategory);
    createTicket.reset(); // a new choice makes the previous server error irrelevant
  };

  const resetForm = () => {
    setCategory(null);
    setDescription('');
    setSubmitted(false);
    createTicket.reset();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!category || description.length > DESCRIPTION_MAX_LENGTH) return;
    createTicket.mutate({ categoryId: category.id, description }, { onSuccess: onCreated });
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Create New Ticket"
      onSubmit={handleSubmit}
      busy={createTicket.isPending}
      onExited={resetForm}
      actions={
        <>
          <Button onClick={onClose} color="inherit" disabled={createTicket.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={createTicket.isPending}>
            Submit
          </Button>
        </>
      }
    >
      {nonFieldError && (
        <Alert severity="error" role="alert" sx={{ mb: 2 }}>
          {nonFieldError}
        </Alert>
      )}
      {categoriesQuery.isError && (
        <Box sx={{ mb: 2 }}>
          <ErrorState
            title="Couldn't load the issue list"
            message={categoriesQuery.error.message}
            onRetry={categoriesQuery.refetch}
          />
        </Box>
      )}

      <Surface variant="inset" sx={{ mb: 2.5 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <Box component="span" sx={{ fontWeight: 600 }}>
            Quick Issues
          </Box>{' '}
          – tap to autofill
        </Typography>
        <ChoiceChips
          ariaLabel="Quick issues"
          options={quickIssueOptions}
          value={category?.id}
          onChange={(id) => selectCategory(options.find((option) => option.id === id))}
          disabled={createTicket.isPending}
        />
      </Surface>

      <Autocomplete
        options={options}
        value={category}
        onChange={(_event, nextCategory) => selectCategory(nextCategory)}
        groupBy={(option) => option.department.name}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, selected) => option.id === selected.id}
        loading={categoriesQuery.isPending}
        disabled={createTicket.isPending}
        renderInput={(params) => (
          <TextField
            {...params}
            required
            label="Issue"
            placeholder="Type or search issue"
            error={Boolean(issueError)}
            helperText={
              issueError || (category ? `Will be routed to ${category.department.name}` : ' ')
            }
          />
        )}
      />

      <CountedTextField
        label="Description"
        placeholder="Describe the issue (optional)"
        multiline
        minRows={3}
        maxRows={10}
        fullWidth
        value={description}
        onChange={setDescription}
        maxLength={DESCRIPTION_MAX_LENGTH}
        error={fieldError(serverError, 'description')}
        disabled={createTicket.isPending}
        sx={{ mt: 2 }}
      />
    </AppDialog>
  );
}

CreateTicketDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};
