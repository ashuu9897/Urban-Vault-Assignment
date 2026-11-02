import { Box } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * The "UV" mark: a U with a round bottom and a downward triangle with softened corners.
 * Drawn in `currentColor`, so it follows the theme's text colour in light and dark mode.
 * (public/favicon.svg uses the same paths.)
 */
export function BrandLogo({ height = 22 }) {
  return (
    <Box
      component="svg"
      viewBox="0 0 390 184"
      aria-hidden
      sx={{ height, width: 'auto', display: 'block', color: 'text.primary', flexShrink: 0 }}
    >
      <path
        fill="currentColor"
        d="M6 0H162A6 6 0 0 1 168 6V100A84 84 0 0 1 0 100V6A6 6 0 0 1 6 0Z"
      />
      <path
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="16"
        strokeLinejoin="round"
        d="M198 8H382L290 169Z"
      />
    </Box>
  );
}

BrandLogo.propTypes = {
  height: PropTypes.number,
};
