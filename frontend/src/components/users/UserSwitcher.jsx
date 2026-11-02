import {
  FormControl,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import PropTypes from 'prop-types';

import { ROLE_GROUPS } from '../../utils/constants';
import { userShape } from '../../utils/propTypes';

function teamOf(user) {
  return user.organization?.name ?? user.department?.name ?? '';
}

/** Demo "Viewing as" selector, grouped into Clients / Department POCs / Technicians. */
export function UserSwitcher({ users, value, onChange }) {
  // MUI's Select needs a flat list of children, so headers and items are interleaved.
  const items = ROLE_GROUPS.flatMap(({ role, label }) => [
    <ListSubheader key={`group-${role}`}>{label}</ListSubheader>,
    ...users
      .filter((user) => user.role === role)
      .map((user) => (
        <MenuItem key={user.id} value={user.id} sx={{ display: 'block' }}>
          <Typography variant="body2" fontWeight={500}>
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.designation} · {teamOf(user)}
          </Typography>
        </MenuItem>
      )),
  ]);

  return (
    <FormControl
      size="small"
      sx={{ minWidth: { xs: 150, sm: 220 }, maxWidth: { xs: 180, sm: 280 } }}
    >
      <InputLabel id="viewing-as-label">Viewing as</InputLabel>
      <Select
        labelId="viewing-as-label"
        label="Viewing as"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        renderValue={(id) => users.find((user) => user.id === id)?.name}
        MenuProps={{ slotProps: { paper: { sx: { maxHeight: 420 } } } }}
      >
        {items}
      </Select>
    </FormControl>
  );
}

UserSwitcher.propTypes = {
  users: PropTypes.arrayOf(userShape).isRequired,
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
