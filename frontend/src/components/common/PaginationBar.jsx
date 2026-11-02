import { Box, Pagination } from '@mui/material';
import PropTypes from 'prop-types';

/** Page-number navigation; renders nothing when everything fits on one page. */
export function PaginationBar({ count, page, pageSize, onChange, ariaLabel, disabled = false }) {
  const pageCount = Math.ceil(count / pageSize);
  if (pageCount <= 1) return null;

  return (
    <Box
      component="nav"
      aria-label={ariaLabel}
      sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}
    >
      <Pagination
        count={pageCount}
        page={page}
        onChange={(_event, nextPage) => onChange(nextPage)}
        disabled={disabled}
        color="primary"
        shape="rounded"
        siblingCount={0}
      />
    </Box>
  );
}

PaginationBar.propTypes = {
  count: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  ariaLabel: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};
