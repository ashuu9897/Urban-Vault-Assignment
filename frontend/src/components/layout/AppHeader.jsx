import { AppBar, Box, Chip, Divider, Toolbar, Typography } from '@mui/material';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { ROLE_LABELS } from '../../utils/constants';
import { ThemeToggle } from '../common/ThemeToggle';
import { UserSwitcher } from '../users/UserSwitcher';
import { BrandLogo } from './BrandLogo';

export const HEADER_HEIGHT = 64;

export function AppHeader() {
  const { currentUser, users, switchUser } = useCurrentUser();

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <Toolbar sx={{ gap: { xs: 1, sm: 1.5 }, minHeight: { xs: HEADER_HEIGHT } }}>
        <BrandLogo height={22} />
        <Divider
          orientation="vertical"
          flexItem
          sx={{ my: 2.5, display: { xs: 'none', sm: 'block' } }}
        />
        <Typography
          component="span"
          variant="subtitle1"
          sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' }, whiteSpace: 'nowrap' }}
        >
          Facility Helpdesk
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Chip
          size="small"
          label={ROLE_LABELS[currentUser.role]}
          color="primary"
          variant="outlined"
          sx={{ display: { xs: 'none', md: 'flex' } }}
        />
        <UserSwitcher users={users} value={currentUser.id} onChange={switchUser} />
        <ThemeToggle />
      </Toolbar>
    </AppBar>
  );
}
