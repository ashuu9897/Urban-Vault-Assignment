import { TextField } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Text field with a live "n/max" counter. Typing past `maxLength` is allowed but flagged,
 * so pasted text isn't silently cut off. `error` (a message) replaces the counter; `hint`
 * is appended to it. Any other TextField prop is passed through.
 */
export function CountedTextField({ value, onChange, maxLength, error, hint, ...textFieldProps }) {
  const tooLong = value.length > maxLength;
  const message = error || (tooLong && `Must be at most ${maxLength} characters.`);
  const counter = `${value.length}/${maxLength}${hint ? ` · ${hint}` : ''}`;

  return (
    <TextField
      {...textFieldProps}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(message)}
      helperText={message || counter}
    />
  );
}

CountedTextField.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  maxLength: PropTypes.number.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  hint: PropTypes.string,
};
