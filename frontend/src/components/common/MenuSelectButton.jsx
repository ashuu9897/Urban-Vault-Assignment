import CheckIcon from '@mui/icons-material/Check';
import {
  Badge,
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';

/**
 * A toolbar button that opens a single-choice menu (used for Filters and Sort).
 * On narrow screens only the icon is shown; `ariaLabel` keeps it accessible.
 */
export function MenuSelectButton({
  id,
  icon,
  label,
  ariaLabel,
  menuTitle,
  options,
  value,
  onChange,
  showDot = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const menuId = `${id}-menu`;

  const choose = (nextValue) => {
    setAnchorEl(null);
    if (nextValue !== value) onChange(nextValue);
  };

  return (
    <>
      <Button
        id={id}
        variant="outlined"
        color="inherit"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-controls={anchorEl ? menuId : undefined}
        aria-expanded={anchorEl ? 'true' : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        startIcon={
          <Badge color="primary" variant="dot" invisible={!showDot}>
            {icon}
          </Badge>
        }
        sx={{
          flexShrink: 0,
          minWidth: 0,
          height: 40,
          px: { xs: 1.25, sm: 1.75 },
          borderColor: 'divider',
          whiteSpace: 'nowrap',
          '& .MuiButton-startIcon': { mr: { xs: 0, sm: 1 }, ml: 0 },
        }}
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          {label}
        </Box>
      </Button>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{ 'aria-labelledby': id }}
      >
        <ListSubheader>{menuTitle}</ListSubheader>
        {options.map((option) => (
          <MenuItem
            key={option.value || 'all'}
            selected={option.value === value}
            onClick={() => choose(option.value)}
          >
            <ListItemIcon>
              {option.value === value && <CheckIcon fontSize="small" aria-hidden />}
            </ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

MenuSelectButton.propTypes = {
  id: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  menuTitle: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  showDot: PropTypes.bool,
};
