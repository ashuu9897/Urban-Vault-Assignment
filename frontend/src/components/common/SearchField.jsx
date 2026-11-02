import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';

/**
 * Search input that reports what was typed once the user pauses (`debounceMs`).
 * `value` is the search currently applied; if it changes from outside (e.g. "Clear
 * filters", the back button) the input follows it.
 */
export function SearchField({ value, onSearch, placeholder, ariaLabel, debounceMs = 300 }) {
  const [text, setText] = useState(value);
  const debouncedSearch = useDebouncedCallback(onSearch, debounceMs);

  useEffect(() => {
    setText(value);
  }, [value]);

  const handleChange = (nextText) => {
    setText(nextText);
    debouncedSearch(nextText);
  };

  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      sx={{ flex: '1 1 220px', minWidth: 0 }}
      slotProps={{
        htmlInput: { 'aria-label': ariaLabel },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" aria-hidden />
            </InputAdornment>
          ),
          endAdornment: text ? (
            <InputAdornment position="end">
              <IconButton size="small" aria-label="Clear search" onClick={() => handleChange('')}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
        },
      }}
    />
  );
}

SearchField.propTypes = {
  value: PropTypes.string.isRequired,
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  debounceMs: PropTypes.number,
};
