import { Container } from '@mui/material';
import PropTypes from 'prop-types';

import { MOBILE_BOTTOM_INSET } from '../../theme/layout';

export function PageContainer({ children }) {
  return (
    <Container
      component="main"
      maxWidth="xl"
      sx={{
        pt: { xs: 2, md: 3 },
        pb: { xs: MOBILE_BOTTOM_INSET, md: 3 },
        px: { xs: 1.5, sm: 3 },
      }}
    >
      {children}
    </Container>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
};
