import { Chip } from '@mui/material';
import PropTypes from 'prop-types';

const PALETTE_COLORS = ['primary', 'secondary', 'error', 'warning', 'success', 'info'];

/**
 * Small label chip. `tonal` (default) is a soft tint of the colour with coloured text;
 * `solid` is the filled colour for things that must stand out. Follows light/dark mode via
 * the theme's CSS variables.
 */
export function TonalChip({ label, color = 'primary', icon, variant = 'tonal' }) {
  if (variant === 'solid') {
    return <Chip size="small" color={color} icon={icon} label={label} sx={{ fontWeight: 600 }} />;
  }
  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      sx={(theme) => {
        const channel = theme.vars.palette[color].mainChannel;
        return {
          height: 'auto',
          minHeight: 24,
          color: theme.vars.palette[color].main,
          backgroundColor: `rgba(${channel} / 0.1)`,
          border: `1px solid rgba(${channel} / 0.28)`,
          '& .MuiChip-icon': { color: 'inherit', fontSize: 16 },
          '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 },
        };
      }}
    />
  );
}

TonalChip.propTypes = {
  label: PropTypes.node.isRequired,
  color: PropTypes.oneOf(PALETTE_COLORS),
  icon: PropTypes.element,
  variant: PropTypes.oneOf(['tonal', 'solid']),
};
