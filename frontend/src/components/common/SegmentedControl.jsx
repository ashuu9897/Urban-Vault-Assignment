import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import PropTypes from 'prop-types';

/** Compact single-choice toggle (e.g. All / Actions / Comments). Always keeps one selected. */
export function SegmentedControl({ options, value, onChange, ariaLabel, sx }) {
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_event, next) => next !== null && onChange(next)}
      aria-label={ariaLabel}
      sx={sx}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} sx={{ py: 0.25, px: 1.25 }}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

SegmentedControl.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  sx: PropTypes.object,
};
