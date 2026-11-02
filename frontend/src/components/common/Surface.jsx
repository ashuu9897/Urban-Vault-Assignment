import { Box, Paper } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Two bordered containers used across the app:
 * - `panel`: a card-like page section (list column, ticket detail, not-found page).
 * - `inset`: a softly tinted box for quoted text inside a panel (description, comments).
 */
export function Surface({ variant = 'panel', component, sx, children, ...rest }) {
  const base =
    variant === 'panel'
      ? { border: 1, borderColor: 'divider', borderRadius: 3 }
      : { p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2, bgcolor: 'action.hover' };
  const Root = variant === 'panel' ? Paper : Box;

  return (
    <Root component={component} sx={[base, ...(Array.isArray(sx) ? sx : [sx])]} {...rest}>
      {children}
    </Root>
  );
}

Surface.propTypes = {
  variant: PropTypes.oneOf(['panel', 'inset']),
  component: PropTypes.elementType,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  children: PropTypes.node,
};
