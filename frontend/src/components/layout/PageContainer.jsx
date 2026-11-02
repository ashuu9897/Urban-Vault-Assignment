import { Container } from '@mui/material';
import PropTypes from 'prop-types';

export function PageContainer({ children }) {
  return (
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 1.5, sm: 3 } }}>
      {children}
    </Container>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
};
