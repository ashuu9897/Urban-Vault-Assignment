import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined';
import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { EmptyState } from '../components/common/EmptyState';
import { Surface } from '../components/common/Surface';
import { paths } from '../utils/paths';

export function NotFoundPage() {
  return (
    <Surface sx={{ maxWidth: 560, mx: 'auto', mt: 4 }}>
      <EmptyState
        icon={SearchOffOutlinedIcon}
        title="Page not found"
        message="The page you are looking for does not exist."
        action={
          <Button component={RouterLink} to={paths.tickets} variant="contained">
            Go to tickets
          </Button>
        }
      />
    </Surface>
  );
}
