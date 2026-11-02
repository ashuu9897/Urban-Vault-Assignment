import {
  Alert,
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

import { fieldError, isValidationError } from '../../api/client';
import { useAssignableTechnicians } from '../../hooks/useAssignableTechnicians';
import { useAssignTicket } from '../../hooks/useTicketMutations';

/** "Select worker" dropdown (technicians of the ticket's department) + Ok. */
export function AssignTechnicianForm({ ticketId, departmentName, onCancel }) {
  const techniciansQuery = useAssignableTechnicians(ticketId);
  const assign = useAssignTicket(ticketId);
  const [technicianId, setTechnicianId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const technicianError =
    (submitted && !technicianId && 'Please select a technician.') ||
    fieldError(assign.error, 'technician_id');
  const generalError =
    isValidationError(assign.error) && !fieldError(assign.error, 'technician_id')
      ? assign.error.message
      : null;

  let helperText = technicianError || `${departmentName} technicians`;
  if (!technicianError && techniciansQuery.isPending) helperText = 'Loading technicians…';
  if (!technicianError && techniciansQuery.isError) helperText = "Couldn't load technicians.";

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (technicianId) assign.mutate(technicianId);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {generalError && (
        <Alert severity="error" role="alert" sx={{ mb: 1.5 }}>
          {generalError}
        </Alert>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'flex-start' }}>
        <FormControl size="small" fullWidth required error={Boolean(technicianError)}>
          <InputLabel id="assign-technician-label">Select worker</InputLabel>
          <Select
            labelId="assign-technician-label"
            label="Select worker *"
            value={technicianId}
            onChange={(event) => setTechnicianId(event.target.value)}
            disabled={!techniciansQuery.isSuccess || assign.isPending}
            aria-describedby="assign-technician-helper"
          >
            {(techniciansQuery.data ?? []).map((technician) => (
              <MenuItem key={technician.id} value={technician.id}>
                {technician.name} ({technician.designation})
              </MenuItem>
            ))}
          </Select>
          <FormHelperText id="assign-technician-helper">{helperText}</FormHelperText>
        </FormControl>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button color="inherit" onClick={onCancel} disabled={assign.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={assign.isPending}>
            Ok
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}

AssignTechnicianForm.propTypes = {
  ticketId: PropTypes.number.isRequired,
  departmentName: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
};
