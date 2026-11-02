import { Typography } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * Small uppercase label. As a heading (default) it titles a section ("ISSUE DESCRIPTION");
 * `outlined` renders a tiny boxed tag instead ("HISTORY", "COMMENT").
 */
export function SectionLabel({ children, id, component = 'h3', outlined = false }) {
  return (
    <Typography
      id={id}
      component={component}
      variant="overline"
      color="text.secondary"
      sx={
        outlined
          ? {
              display: 'inline-block',
              fontSize: 10,
              lineHeight: 1.6,
              px: 0.75,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
            }
          : undefined
      }
    >
      {children}
    </Typography>
  );
}

SectionLabel.propTypes = {
  children: PropTypes.node.isRequired,
  id: PropTypes.string,
  component: PropTypes.elementType,
  outlined: PropTypes.bool,
};
